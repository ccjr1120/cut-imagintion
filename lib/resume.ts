import type {
  ResumeCampus,
  ResumeContent,
  ResumeCopy,
  ResumeEducation,
  ResumePersonalCategory,
  ResumeProject,
  ResumeRole,
  ResumeRoleLabel,
} from './types';

export const resumeRoles: ResumeRole[] = ['video-editor', 'editing-assistant', 'information-flow'];

export const defaultResumeContent: ResumeContent = {
  name: '古梦雪',
  phone: '18708891784',
  email: '936374627@qq.com',
  portfolioUrl: 'https://imagintion.gleeze.com/',
  portfolioLabel: '进入古梦雪视频剪辑作品集',
  updatedLabel: 'UPDATED 2026',
  roleLabels: {
    'video-editor': { label: '视频剪辑师', shortLabel: '视频剪辑' },
    'editing-assistant': { label: '剪辑助理 / 后期执行', shortLabel: '剪辑助理' },
    'information-flow': { label: '信息流剪辑师', shortLabel: '信息流' },
  },
  roleCopies: {
    'information-flow': {
      eyebrow: 'VIDEO EDITOR / PERFORMANCE CREATIVE',
      summary: '专注短视频信息流广告后期，擅长从用户痛点和产品卖点出发，搭建前 3 秒钩子、实测证明与行动引导，完成从素材筛选到成片包装的完整剪辑流程。',
      highlights: ['独立完成垃圾袋信息流推广：以日常痛点切入，用暴力测试和对比演示建立产品信任，完成素材筛选、字幕与特效包装。', '完成洗面奶信息流推广：设计开头钩子，组织皮肤实测、质地特写和成分展示，搭建短视频广告叙事结构。', '熟悉千川广告投放、带货素材的节奏与卖点表达，能够根据投放目标快速迭代素材版本。'],
      skills: [{ label: '广告剪辑', value: '钩子设计 / 卖点拆解 / 素材筛选 / 节奏优化' }, { label: '包装执行', value: '动态字幕 / 纹理叠加 / 对比演示 / 重点标注' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧创意 / 视觉素材生成 / 风格测试' }],
      selfEvaluation: '兴趣是最好的老师。我热爱用视频表达创作力，熟悉信息流广告剪辑与相关软件应用，保持主动学习和复盘迭代，愿意持续精进并在岗位中高效成长。',
    },
    'editing-assistant': {
      eyebrow: 'VIDEO EDITOR / POST-PRODUCTION',
      summary: '面向剪辑助理与后期执行岗位，能稳定承接素材整理、气口粗剪、镜头筛选、字幕音效包装和基础调色，具备 Premiere Pro、After Effects、剪映与 CapCut 工作流经验。',
      highlights: ['装修避雷口播：完成气口粗剪、特效音效包装，用图文补充、人物缩放与重点标注降低信息理解门槛。', '汽车宣传口播：完成粗剪、字幕包装和汽车特写筛选，把控整体情绪节奏并突出产品卖点。', '影视与动漫混剪：根据 BGM 重构叙事，完成卡点剪辑、蒙版、转场和氛围感包装。', 'MG 动画：使用 After Effects 完成数据可视化动态图形、图表入场与数据跳动特效。'],
      skills: [{ label: '后期执行', value: '素材筛选 / 气口粗剪 / 卡点剪辑 / 字幕与音效' }, { label: '视觉包装', value: '动态字幕 / 蒙版转场 / 图文穿插 / 基础调色' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧分镜 / 角色与场景设定 / 素材生成' }],
      selfEvaluation: '兴趣是最好的老师。我热爱视频创作，熟悉相关剪辑软件应用，愿意主动学习并从素材整理、后期执行等基础工作做起，在团队协作中持续提升、稳定成长。',
    },
    'video-editor': {
      eyebrow: 'VIDEO EDITOR / EDITING & VISUAL STORYTELLING',
      summary: '具备从素材筛选、叙事结构、粗剪精剪到字幕、声音、调色和动态包装的完整视频后期能力，能够结合内容目标完成广告、口播、影视混剪与 MG 动画等不同类型的视频创作。',
      highlights: ['覆盖信息流广告、知识口播、汽车宣传、影视混剪、动漫混剪和 MG 动画等多种内容类型，能够根据题材调整节奏与视觉表达。', '具备从脚本与素材理解到成片输出的完整剪辑意识，关注镜头衔接、音乐情绪、信息层级和画面质感。', '熟悉 AIGC 工作流，可使用 ComfyUI 进行灵感探索、角色与场景设定、AI 短剧分镜和视觉素材生成，辅助前期创意与后期制作。'],
      skills: [{ label: '剪辑能力', value: '叙事结构 / 粗剪精剪 / 节奏设计 / 音画合成' }, { label: '视觉包装', value: '动态字幕 / 调色 / 蒙版转场 / MG 动画' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧分镜 / 角色与场景设定 / 视觉素材生成 / 风格测试' }],
      selfEvaluation: '兴趣是最好的老师。我热爱用视频表达创作力，能够主动学习并适应不同题材和制作流程；同时关注生成式视觉工作流的发展，愿意将 AIGC 工具（如 ComfyUI）融入 AI 短剧创意、前期分镜与后期制作，在实践中持续提升。',
    },
  },
  education: { period: '2022.09 - 2026.07', school: '玉溪师范学院', major: '数学与应用数学' },
  campus: {
    title: '影视策划工作室部长经历',
    period: '2022.09 - 2024.07',
    organization: '玉溪师范学院校团委',
    role: '影视策划工作室成员 / 继任部长',
    bullets: ['全流程负责：独立主导宣传视频，包括脚本撰写、拍摄执行、后期剪辑与特效包装，完成从创意构思到成片输出的闭环工作。', '专业技能应用：熟练应用 PR、AE 等软件完成镜头组接、调色、音画合成及动态图形设计。', '内容策划：结合校园热点撰写故事化脚本，创作校园宣传片并获得师生好评。'],
  },
  projects: [
    { id: 'campus-theme-video', title: '校园主题宣传', type: '校园宣传片', year: '2022 - 2024', description: '完成新生宣传视频与教师节宣传活动记录，围绕校园主题进行内容策划与后期剪辑包装。', role: '负责脚本梳理、镜头组接、字幕与基础包装。', software: 'Premiere Pro / After Effects' },
    { id: 'campus-event-interview', title: '校园活动与人物记录', type: '校园活动视频', year: '2022 - 2024', description: '完成运动会视频与毕业生采访，兼顾活动节奏和人物内容表达。', role: '负责素材筛选、采访内容剪辑、调色与音画合成。', software: 'Premiere Pro / After Effects' },
  ],
  personalCategories: [
    { categoryId: 'new-category', title: '信息流', description: '垃圾袋、洗面奶信息流：围绕用户痛点、产品实测和卖点包装制作千川带货素材。' },
    { categoryId: 'new-category-2', title: '口播', description: '装修避雷、汽车宣传口播：通过气口粗剪、字幕特效和情绪节奏提升信息表达。' },
    { categoryId: 'new-category-3', title: '混剪', description: '动漫混剪、《小巷人家》：结合 BGM 卡点重构叙事，完成蒙版、转场和氛围包装。' },
    { categoryId: 'new-category-4', title: 'MG 动画', description: '企业运营可视化：制作数据图表、路径生长和百分比跳动等 MG 动画特效。' },
  ],
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultResumeContent)) as ResumeContent;
}

function readText(value: unknown, fallback: string, max = 5000) {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function readList(value: unknown, fallback: string[], max = 20) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, max).map((item) => item.slice(0, 5000)) : fallback;
}

function normalizeRoleCopy(value: unknown, fallback: ResumeCopy): ResumeCopy {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const skills = Array.isArray(item.skills) ? item.skills.filter((skill): skill is Record<string, unknown> => Boolean(skill) && typeof skill === 'object').slice(0, 20).map((skill, index) => ({ label: readText(skill.label, fallback.skills[index]?.label || '', 120), value: readText(skill.value, fallback.skills[index]?.value || '', 500) })) : fallback.skills;
  return { eyebrow: readText(item.eyebrow, fallback.eyebrow, 200), summary: readText(item.summary, fallback.summary, 3000), highlights: readList(item.highlights, fallback.highlights), skills, selfEvaluation: readText(item.selfEvaluation, fallback.selfEvaluation, 3000) };
}

export function normalizeResume(value: unknown): ResumeContent {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const result = cloneDefaults();
  result.name = readText(source.name, result.name, 100);
  result.phone = readText(source.phone, result.phone, 60);
  result.email = readText(source.email, result.email, 160);
  result.portfolioUrl = readText(source.portfolioUrl, result.portfolioUrl, 2048);
  result.portfolioLabel = readText(source.portfolioLabel, result.portfolioLabel, 200);
  result.updatedLabel = readText(source.updatedLabel, result.updatedLabel, 80);

  const labels = source.roleLabels && typeof source.roleLabels === 'object' ? source.roleLabels as Record<string, unknown> : {};
  resumeRoles.forEach((role) => {
    const item = labels[role] && typeof labels[role] === 'object' ? labels[role] as Record<string, unknown> : {};
    result.roleLabels[role] = { label: readText(item.label, result.roleLabels[role].label, 100), shortLabel: readText(item.shortLabel, result.roleLabels[role].shortLabel, 60) };
  });
  const copies = source.roleCopies && typeof source.roleCopies === 'object' ? source.roleCopies as Record<string, unknown> : {};
  resumeRoles.forEach((role) => { result.roleCopies[role] = normalizeRoleCopy(copies[role], result.roleCopies[role]); });

  const education = source.education && typeof source.education === 'object' ? source.education as Record<string, unknown> : {};
  result.education = { period: readText(education.period, result.education.period, 100), school: readText(education.school, result.education.school, 160), major: readText(education.major, result.education.major, 160) } as ResumeEducation;
  const campus = source.campus && typeof source.campus === 'object' ? source.campus as Record<string, unknown> : {};
  result.campus = { title: readText(campus.title, result.campus.title, 200), period: readText(campus.period, result.campus.period, 100), organization: readText(campus.organization, result.campus.organization, 200), role: readText(campus.role, result.campus.role, 200), bullets: readList(campus.bullets, result.campus.bullets) } as ResumeCampus;

  if (Array.isArray(source.projects)) {
    result.projects = source.projects.filter((project): project is Record<string, unknown> => Boolean(project) && typeof project === 'object').slice(0, 20).map((project, index) => ({ id: readText(project.id, `resume-project-${index + 1}`, 80), title: readText(project.title, '', 200), type: readText(project.type, '', 100), year: readText(project.year, '', 60), description: readText(project.description, '', 3000), role: readText(project.role, '', 500), software: readText(project.software, '', 300) } as ResumeProject));
  }
  if (Array.isArray(source.personalCategories)) {
    result.personalCategories = source.personalCategories.filter((category): category is Record<string, unknown> => Boolean(category) && typeof category === 'object').slice(0, 30).map((category) => ({ categoryId: readText(category.categoryId, '', 80), title: readText(category.title, '', 160), description: readText(category.description, '', 1000) } as ResumePersonalCategory));
  }
  return result;
}
