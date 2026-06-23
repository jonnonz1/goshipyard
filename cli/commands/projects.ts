// projects commands: list / get / create / update / delete / set-images / rm-image
import { parse, requireAuth, str, num, UsageError, type Values } from '../shared.ts';
import { print, printJson, info, table, truncate } from '../output.ts';
import { confirm } from '../prompt.ts';
import type { ListParams, Project } from '../types.ts';

export async function projectsCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  const rest = argv.slice(1);
  switch (verb) {
    case 'list':
      return list(rest);
    case 'get':
      return get(rest);
    case 'create':
      return create(rest);
    case 'update':
      return update(rest);
    case 'delete':
    case 'rm':
      return remove(rest);
    case 'set-images':
      return setImages(rest);
    case 'rm-image':
      return rmImage(rest);
    case undefined:
    case 'help':
      return projectsHelp();
    default:
      throw new UsageError(`Unknown projects command: ${verb}. Try \`shipyard projects help\`.`);
  }
}

function listParams(values: Values): ListParams {
  const sort = str(values.sort);
  return {
    sort: sort === 'top' ? 'top' : sort === 'new' ? 'new' : undefined,
    q: str(values.search),
    category: str(values.category),
    limit: num(values.limit),
    offset: num(values.offset),
  };
}

async function list(argv: string[]): Promise<void> {
  const { values } = parse(argv, {
    mine: { type: 'boolean' },
    user: { type: 'string' },
    sort: { type: 'string' },
    search: { type: 'string', short: 'q' },
    category: { type: 'string', short: 'c' },
    limit: { type: 'string' },
    offset: { type: 'string' },
  });
  if (values.help)
    return print(
      'Usage: shipyard projects list [--mine | --user HANDLE] [--sort new|top] [-q TEXT] [-c CATEGORY] [--limit N] [--offset N]',
    );

  const client = requireAuth(values);
  const params = listParams(values);
  const user = str(values.user);
  const result = values.mine
    ? await client.listMine(params)
    : user
      ? await client.listUser(user, params)
      : await client.listProjects(params);

  if (values.json) return printJson(result);
  if (!result.data.length) {
    info('No projects.');
    return;
  }
  print(
    table(result.data, [
      { header: 'ID', get: (p) => p.id.slice(0, 8) },
      { header: 'SLUG', get: (p) => truncate(p.slug, 24) },
      { header: 'TITLE', get: (p) => truncate(p.title, 40) },
      { header: 'CAT', get: (p) => p.category },
      { header: '▲', get: (p) => String(p.upvotes) },
      { header: 'REV', get: (p) => String(p.reviews) },
      { header: 'CREATED', get: (p) => p.created_at.slice(0, 10) },
    ]),
  );
  const pg = result.pagination;
  if (pg.has_more) info(`… more available — re-run with --offset ${pg.offset + pg.limit}`);
}

async function get(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv);
  if (values.help || !positionals[0]) return print('Usage: shipyard projects get <id>');
  const p = await requireAuth(values).getProject(positionals[0]);
  if (values.json) return printJson(p);
  printDetail(p);
}

const CONTENT_OPTIONS = {
  title: { type: 'string', short: 't' },
  pitch: { type: 'string', short: 'p' },
  url: { type: 'string', short: 'u' },
  category: { type: 'string', short: 'c' },
  'repo-url': { type: 'string' },
  body: { type: 'string' },
  'body-file': { type: 'string' },
} as const;

async function create(argv: string[]): Promise<void> {
  const { values } = parse(argv, {
    ...CONTENT_OPTIONS,
    slug: { type: 'string' },
    hero: { type: 'string' },
    image: { type: 'string', multiple: true },
  });
  if (values.help) return createHelp();

  const client = requireAuth(values);
  const title = str(values.title);
  const pitch = str(values.pitch);
  const url = str(values.url);
  if (!title || !pitch || !url) {
    throw new UsageError('create requires --title, --pitch and --url.');
  }

  const fields: Record<string, string> = { title, pitch, url };
  if (str(values.category)) fields.category = str(values.category)!;
  if (str(values['repo-url'])) fields.repo_url = str(values['repo-url'])!;
  if (str(values.slug)) fields.slug = str(values.slug)!;
  const body = await resolveBody(values);
  if (body !== undefined) fields.body = body;

  const hero = str(values.hero);
  const images = (values.image as string[] | undefined) ?? [];
  const project =
    hero || images.length
      ? await client.createProjectForm(await buildImageForm(fields, hero, images))
      : await client.createProject(fields as never);

  if (values.json) return printJson(project);
  info(`✓ Created @${project.owner_handle}/${project.slug}`);
  print(project.html_url);
}

async function update(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, CONTENT_OPTIONS);
  if (values.help || !positionals[0]) return updateHelp();

  const patch: Record<string, string> = {};
  if (str(values.title) !== undefined) patch.title = str(values.title)!;
  if (str(values.pitch) !== undefined) patch.pitch = str(values.pitch)!;
  if (str(values.url) !== undefined) patch.url = str(values.url)!;
  if (str(values.category) !== undefined) patch.category = str(values.category)!;
  if (str(values['repo-url']) !== undefined) patch.repo_url = str(values['repo-url'])!;
  const body = await resolveBody(values);
  if (body !== undefined) patch.body = body;
  if (!Object.keys(patch).length) {
    throw new UsageError('update needs at least one field to change (e.g. --pitch).');
  }

  const p = await requireAuth(values).updateProject(positionals[0], patch);
  if (values.json) return printJson(p);
  info(`✓ Updated @${p.owner_handle}/${p.slug}`);
}

async function remove(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, { yes: { type: 'boolean', short: 'y' } });
  if (values.help || !positionals[0]) return print('Usage: shipyard projects delete <id> [-y]');
  const id = positionals[0];
  const client = requireAuth(values);
  if (!values.yes && !(await confirm(`Delete project ${id}? This cannot be undone.`))) {
    info('Aborted.');
    return;
  }
  const res = await client.deleteProject(id);
  if (values.json) return printJson(res);
  info(`✓ Deleted ${res.id}`);
}

async function setImages(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, {
    hero: { type: 'string' },
    image: { type: 'string', multiple: true },
  });
  if (values.help || !positionals[0]) {
    return print(
      'Usage: shipyard projects set-images <id> [--hero FILE] [--image FILE …]  (replaces the whole set)',
    );
  }
  const hero = str(values.hero);
  const images = (values.image as string[] | undefined) ?? [];
  if (!hero && !images.length) {
    throw new UsageError(
      'Provide --hero and/or --image. (Use rm-image to delete a single ordinal.)',
    );
  }
  const p = await requireAuth(values).setImages(
    positionals[0],
    await buildImageForm({}, hero, images),
  );
  if (values.json) return printJson(p);
  info(`✓ Set ${p.images.length} image(s) on @${p.owner_handle}/${p.slug}`);
}

async function rmImage(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv);
  if (values.help || positionals.length < 2)
    return print('Usage: shipyard projects rm-image <id> <ordinal>  (ordinal 0=hero, 1–2=gallery)');
  const ordinal = Number(positionals[1]);
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal > 2) {
    throw new UsageError('ordinal must be 0, 1 or 2.');
  }
  const p = await requireAuth(values).removeImage(positionals[0], ordinal);
  if (values.json) return printJson(p);
  info(`✓ Removed image ${ordinal} from @${p.owner_handle}/${p.slug}`);
}

// --- helpers ----------------------------------------------------------------

async function resolveBody(values: Values): Promise<string | undefined> {
  const file = str(values['body-file']);
  if (file !== undefined) return await Bun.file(file).text();
  return str(values.body);
}

async function buildImageForm(
  fields: Record<string, string>,
  hero: string | undefined,
  images: string[],
): Promise<FormData> {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  if (hero) form.set('hero', await fileFrom(hero));
  for (const img of images.slice(0, 2)) form.append('extra', await fileFrom(img));
  return form;
}

async function fileFrom(path: string): Promise<File> {
  const f = Bun.file(path);
  if (!(await f.exists())) throw new UsageError(`File not found: ${path}`);
  const name = path.split('/').pop() || 'image';
  const type = f.type && f.type.startsWith('image/') ? f.type : guessImageType(name);
  return new File([await f.arrayBuffer()], name, { type });
}

function guessImageType(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  return 'image/png';
}

function printDetail(p: Project): void {
  const lines = [
    `${p.title}  (@${p.owner_handle}/${p.slug})`,
    p.pitch,
    '',
    `id        ${p.id}`,
    `category  ${p.category}`,
    `url       ${p.url}`,
    p.repo_url ? `repo      ${p.repo_url}` : '',
    `upvotes   ${p.upvotes}    reviews   ${p.reviews}`,
    `created   ${p.created_at}`,
    `page      ${p.html_url}`,
    p.images.length
      ? `images    ${p.images.map((i) => `#${i.ordinal} ${i.url}`).join('\n          ')}`
      : 'images    (none)',
    p.body ? `\n${p.body}` : '',
  ].filter((l) => l !== '');
  print(lines.join('\n'));
}

function projectsHelp(): void {
  print(
    [
      'Usage: shipyard projects <command>',
      '',
      '  list         List/search projects (--mine, --user HANDLE, --sort, -q, -c, --limit, --offset)',
      '  get          Show one project: shipyard projects get <id>',
      '  create       Create a project (-t -p -u, optional -c --repo-url --body[-file] --slug --hero --image)',
      '  update       Update fields: shipyard projects update <id> [fields]',
      '  delete       Delete a project: shipyard projects delete <id> [-y]',
      '  set-images   Replace the image set: set-images <id> [--hero F] [--image F …]',
      '  rm-image     Remove one image: rm-image <id> <ordinal>',
    ].join('\n'),
  );
}

function createHelp(): void {
  print(
    [
      'Usage: shipyard projects create -t TITLE -p PITCH -u URL [options]',
      '',
      '  -t, --title       Project name (required)',
      '  -p, --pitch       One-line pitch (required)',
      '  -u, --url         Public http(s) link (required)',
      '  -c, --category    devtools|ai|games|productivity|design|social|data|creative|other',
      '      --repo-url    Source repo URL',
      '      --body        Long-form markdown (or --body-file PATH)',
      '      --slug        Explicit slug (else derived from the title)',
      '      --hero FILE   Hero image (ordinal 0)',
      '      --image FILE  Gallery image (repeatable, up to 2)',
    ].join('\n'),
  );
}

function updateHelp(): void {
  print(
    'Usage: shipyard projects update <id> [-t TITLE] [-p PITCH] [-u URL] [-c CAT] [--repo-url R] [--body B | --body-file F]',
  );
}
