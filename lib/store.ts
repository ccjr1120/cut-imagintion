import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Category, PortfolioContent, Project } from './types';

const dataFile = process.env.PORTFOLIO_DATA_FILE || path.join(process.cwd(), 'data', 'portfolio.json');
export const mediaDirectory = process.env.PORTFOLIO_MEDIA_DIR || path.join(process.cwd(), 'storage', 'media');

function text(value: unknown, field: string, max = 5000) {
  if (typeof value !== 'string') throw new Error(`${field} 必须是文本`);
  return value.trim().slice(0, max);
}

function requiredText(value: unknown, field: string, max = 5000) {
  const result = text(value, field, max);
  if (!result) throw new Error(`${field}不能为空`);
  return result;
}

function media(value: unknown, field: string) {
  const result = text(value, field, 2048);
  if (result && !/^https?:\/\//i.test(result) && !result.startsWith('/api/media/')) {
    throw new Error(`${field} 必须是 http(s) 地址或已上传的媒体`);
  }
  return result;
}

function normalizeCategory(value: unknown, index: number): Category {
  if (!value || typeof value !== 'object') throw new Error(`分类 ${index + 1} 格式错误`);
  const item = value as Record<string, unknown>;
  return {
    id: requiredText(item.id, '分类 ID', 80),
    title: requiredText(item.title, '分类名称', 80),
    enTitle: requiredText(item.enTitle, '分类英文名', 100),
    description: text(item.description, '分类描述', 500),
    cover: media(item.cover, '分类封面'),
    // Categories created before orientation was introduced remain landscape.
    orientation: item.orientation === 'portrait' ? 'portrait' : 'landscape',
  };
}

function normalizeProject(value: unknown, index: number): Project {
  if (!value || typeof value !== 'object') throw new Error(`项目 ${index + 1} 格式错误`);
  const item = value as Record<string, unknown>;
  return {
    id: requiredText(item.id, '项目 ID', 80),
    categoryId: requiredText(item.categoryId, '所属分类', 80),
    title: requiredText(item.title, '项目标题', 120),
    enTitle: requiredText(item.enTitle, '项目英文名', 160),
    type: text(item.type, '项目类型', 80),
    year: text(item.year, '年份', 20),
    duration: text(item.duration, '片长', 20),
    description: text(item.description, '项目描述', 3000),
    role: text(item.role, '职责', 300),
    software: text(item.software, '软件', 300),
    plugins: text(item.plugins, '亮点', 300),
    cover: media(item.cover, '项目封面'),
    video: media(item.video, '项目视频'),
    screenshots: Array.isArray(item.screenshots)
      ? item.screenshots.slice(0, 12).map((url, screenshotIndex) => media(url, `截图 ${screenshotIndex + 1}`)).filter(Boolean)
      : [],
  };
}

export function validateContent(value: unknown): PortfolioContent {
  if (!value || typeof value !== 'object') throw new Error('内容格式错误');
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.categories) || !Array.isArray(source.projects)) {
    throw new Error('分类和项目列表不能为空');
  }
  const categories = source.categories.map(normalizeCategory);
  const projects = source.projects.map(normalizeProject);
  const categoryIds = new Set(categories.map((item) => item.id));
  if (new Set(categories.map((item) => item.id)).size !== categories.length) throw new Error('分类 ID 不能重复');
  if (new Set(projects.map((item) => item.id)).size !== projects.length) throw new Error('项目 ID 不能重复');
  if (projects.some((item) => !categoryIds.has(item.categoryId))) throw new Error('有项目引用了不存在的分类');
  return { categories, projects, updatedAt: new Date().toISOString() };
}

export async function readContent(): Promise<PortfolioContent> {
  const raw = await readFile(/* turbopackIgnore: true */ dataFile, 'utf8');
  return JSON.parse(raw) as PortfolioContent;
}

let pendingWrite = Promise.resolve();

export async function writeContent(value: unknown): Promise<PortfolioContent> {
  const content = validateContent(value);
  const operation = pendingWrite.then(async () => {
    await mkdir(path.dirname(dataFile), { recursive: true });
    const temporary = `${dataFile}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
    await rename(temporary, dataFile);
  });
  pendingWrite = operation.catch(() => undefined);
  await operation;
  return content;
}
