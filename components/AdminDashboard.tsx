'use client';

import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, ExternalLink, FileText, FolderKanban, Image as ImageIcon, LoaderCircle, LogOut, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { resumeRoles } from '@/lib/resume';
import type { Category, PortfolioContent, Project, ResumeCampus, ResumeContent, ResumeCopy, ResumeEducation, ResumePersonalCategory, ResumeProject, ResumeRole } from '@/lib/types';

type Section = 'categories' | 'projects' | 'resume';
type Notice = { type: 'ok' | 'error'; message: string } | null;

function makeId(label: string, existing: string[]) {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;
  let id = base;
  let suffix = 2;
  while (existing.includes(id)) id = `${base}-${suffix++}`;
  return id;
}

async function responseJson(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || '请求失败');
  return body;
}

type UploadedMedia = { url: string };

async function uploadMedia(file: File): Promise<UploadedMedia> {
  const form = new FormData();
  form.append('file', file);
  return responseJson(await fetch('/api/admin/upload', { method: 'POST', body: form })) as Promise<UploadedMedia>;
}

async function createVideoPoster(file: File): Promise<File | null> {
  const source = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = source;

  try {
    await new Promise<void>((resolve, reject) => {
      video.addEventListener('error', () => reject(new Error('无法读取视频画面')), { once: true });
      // loadeddata guarantees that the video's first decoded frame is ready.
      video.addEventListener('loadeddata', () => resolve(), { once: true });
      video.load();
    });

    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return blob ? new File([blob], `${file.name}.jpg`, { type: 'image/jpeg' }) : null;
  } finally {
    URL.revokeObjectURL(source);
    video.removeAttribute('src');
    video.load();
  }
}

async function createVideoScreenshots(file: File, count = 4): Promise<File[]> {
  const source = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.src = source;

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      video.addEventListener('error', () => reject(new Error('无法读取视频画面')), { once: true });
      video.addEventListener('loadedmetadata', () => resolve(video.duration), { once: true });
      video.load();
    });
    if (!Number.isFinite(duration) || duration <= 0 || !video.videoWidth || !video.videoHeight) return [];

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const screenshots: File[] = [];

    for (let index = 0; index < count; index += 1) {
      const time = Math.random() * duration;
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('无法读取视频画面')); };
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = time;
      });
      canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (blob) screenshots.push(new File([blob], `${file.name}-still-${index + 1}.jpg`, { type: 'image/jpeg' }));
    }
    return screenshots;
  } finally {
    URL.revokeObjectURL(source);
    video.removeAttribute('src');
    video.load();
  }
}

async function createPosterFromVideoUrl(url: string): Promise<File> {
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.src = url;

  try {
    const duration = await new Promise<number>((resolve, reject) => {
      video.addEventListener('error', () => reject(new Error('无法读取视频，请检查视频地址或跨域设置')), { once: true });
      video.addEventListener('loadedmetadata', () => resolve(video.duration), { once: true });
      video.load();
    });
    if (!Number.isFinite(duration) || duration <= 0 || !video.videoWidth || !video.videoHeight) {
      throw new Error('无法读取视频时长或画面尺寸');
    }

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('无法定位到视频中间画面')); };
      const cleanup = () => {
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      };
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.currentTime = duration / 2;
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) throw new Error('封面生成失败');
    return new File([blob], 'video-middle-frame.jpg', { type: 'image/jpeg' });
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}

function GeneratePosterButton({ videoUrl, onGenerated }: { videoUrl: string; onGenerated: (value: string) => void }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!videoUrl || generating) return;
    setGenerating(true);
    setError('');
    try {
      const poster = await createPosterFromVideoUrl(videoUrl);
      onGenerated((await uploadMedia(poster)).url);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : '封面生成失败，请手动上传封面');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="poster-generator">
      <button type="button" className="secondary-button" disabled={!videoUrl || generating} onClick={() => void generate()}>
        {generating ? <LoaderCircle className="spin" size={15} /> : <RefreshCw size={15} />}
        {generating ? '生成中' : '重新生成封面'}
      </button>
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

function MediaField({ label, value, accept, onChange, hint, onVideoPoster, onVideoScreenshots }: { label: string; value: string; accept: string; onChange: (value: string) => void; hint?: string; onVideoPoster?: (value: string) => void; onVideoScreenshots?: (values: string[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await uploadMedia(file);
      onChange(result.url);
      if (file.type.startsWith('video/') && onVideoPoster) {
        try {
          const poster = await createVideoPoster(file);
          if (poster) onVideoPoster((await uploadMedia(poster)).url);
        } catch {
          setError('视频已上传，但自动封面生成失败，请手动上传封面');
        }
      }
      if (file.type.startsWith('video/') && onVideoScreenshots) {
        try {
          const screenshots = await createVideoScreenshots(file);
          const uploaded = await Promise.all(screenshots.map((screenshot) => uploadMedia(screenshot)));
          if (uploaded.length) onVideoScreenshots(uploaded.map((item) => item.url));
        } catch {
          setError('视频已上传，但自动截图生成失败，请手动添加截图');
        }
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-field admin-media-field">
      <div className="field-heading"><label>{label}</label>{value && <button type="button" className="icon-button subtle" onClick={() => onChange('')} title="移除"><X size={15} /></button>}</div>
      <div className="media-input-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="粘贴媒体地址，或从本地上传" />
        <label className={`upload-button ${uploading ? 'is-loading' : ''}`}>
          {uploading ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}
          <span>{uploading ? '上传中' : '上传'}</span>
          <input type="file" accept={accept} disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />
        </label>
      </div>
      {hint && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
      {value && accept.startsWith('image') && <div className="media-preview"><img src={value} alt={`${label}预览`} /></div>}
      {value && accept.startsWith('video') && <div className="media-preview video-preview"><video src={value} controls preload="metadata" /></div>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, required, wide, multiline }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; wide?: boolean; multiline?: boolean }) {
  return (
    <div className={`admin-field ${wide ? 'field-wide' : ''}`}>
      <label>{label}{required && <span>必填</span>}</label>
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function MoveButtons({ index, total, onMove }: { index: number; total: number; onMove: (direction: -1 | 1) => void }) {
  return (
    <div className="move-buttons">
      <button type="button" className="icon-button" disabled={index === 0} onClick={() => onMove(-1)} title="上移"><ArrowUp size={15} /></button>
      <button type="button" className="icon-button" disabled={index === total - 1} onClick={() => onMove(1)} title="下移"><ArrowDown size={15} /></button>
    </div>
  );
}

function ResumeEditor({ resume, role, onUpdate }: { resume: ResumeContent; role: ResumeRole; onUpdate: (patch: Partial<ResumeContent>) => void }) {
  const copy = resume.roleCopies[role];
  const roleLabel = resume.roleLabels[role];

  function updateCopy(patch: Partial<ResumeCopy>) {
    onUpdate({ roleCopies: { ...resume.roleCopies, [role]: { ...copy, ...patch } } });
  }

  function updateLabel(patch: Partial<ResumeContent['roleLabels'][ResumeRole]>) {
    onUpdate({ roleLabels: { ...resume.roleLabels, [role]: { ...roleLabel, ...patch } } });
  }

  function updateEducation(patch: Partial<ResumeEducation>) {
    onUpdate({ education: { ...resume.education, ...patch } });
  }

  function updateCampus(patch: Partial<ResumeCampus>) {
    onUpdate({ campus: { ...resume.campus, ...patch } });
  }

  function updateProject(index: number, patch: Partial<ResumeProject>) {
    onUpdate({ projects: resume.projects.map((project, projectIndex) => projectIndex === index ? { ...project, ...patch } : project) });
  }

  function updatePersonalCategory(index: number, patch: Partial<ResumePersonalCategory>) {
    onUpdate({ personalCategories: resume.personalCategories.map((category, categoryIndex) => categoryIndex === index ? { ...category, ...patch } : category) });
  }

  return (
    <form className="editor-form resume-editor-form" onSubmit={(event) => event.preventDefault()}>
      <div className="form-section-heading"><span>01</span><div><h2>基本信息</h2><p>简历姓名、联系方式和作品集入口</p></div></div>
      <div className="form-grid">
        <TextField label="姓名" required value={resume.name} onChange={(name) => onUpdate({ name })} />
        <TextField label="电话" value={resume.phone} onChange={(phone) => onUpdate({ phone })} />
        <TextField label="邮箱" value={resume.email} onChange={(email) => onUpdate({ email })} />
        <TextField label="底部更新时间" value={resume.updatedLabel} onChange={(updatedLabel) => onUpdate({ updatedLabel })} placeholder="例如：UPDATED 2026" />
        <TextField label="作品集链接" wide value={resume.portfolioUrl} onChange={(portfolioUrl) => onUpdate({ portfolioUrl })} />
        <TextField label="作品集链接文字" wide value={resume.portfolioLabel} onChange={(portfolioLabel) => onUpdate({ portfolioLabel })} />
      </div>

      <div className="form-section-heading"><span>02</span><div><h2>岗位版本</h2><p>当前版本：{roleLabel.label}。切换左侧版本可分别编辑三份简历。</p></div></div>
      <div className="form-grid">
        <TextField label="岗位名称" required value={roleLabel.label} onChange={(label) => updateLabel({ label })} />
        <TextField label="切换按钮名称" required value={roleLabel.shortLabel} onChange={(shortLabel) => updateLabel({ shortLabel })} />
        <TextField label="岗位英文眉题" wide value={copy.eyebrow} onChange={(eyebrow) => updateCopy({ eyebrow })} />
        <TextField label="岗位简介" wide multiline value={copy.summary} onChange={(summary) => updateCopy({ summary })} />
      </div>
      <div className="form-section-heading"><span>03</span><div><h2>技能与自我评价</h2><p>当前岗位版本在简历中展示的技能条目与自我评价</p></div><button type="button" className="secondary-button" onClick={() => updateCopy({ skills: [...copy.skills, { label: '', value: '' }] })}><Plus size={15} />添加技能</button></div>
      <div className="resume-editor-list">
        {copy.skills.map((skill, index) => <div className="resume-editor-item resume-skill-item" key={`${skill.label}-${index}`}><TextField label={`技能 ${index + 1}`} value={skill.label} onChange={(label) => updateCopy({ skills: copy.skills.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) })} /><TextField label="技能内容" value={skill.value} onChange={(value) => updateCopy({ skills: copy.skills.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item) })} /><button type="button" className="remove-screenshot" onClick={() => updateCopy({ skills: copy.skills.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button></div>)}
      </div>
      <TextField label="自我评价" wide multiline value={copy.selfEvaluation} onChange={(selfEvaluation) => updateCopy({ selfEvaluation })} />
      <div className="form-section-heading"><span>04</span><div><h2>教育背景</h2><p>当前简历中的教育经历</p></div></div>
      <div className="form-grid"><TextField label="时间" value={resume.education.period} onChange={(period) => updateEducation({ period })} /><TextField label="学校" value={resume.education.school} onChange={(school) => updateEducation({ school })} /><TextField label="专业" wide value={resume.education.major} onChange={(major) => updateEducation({ major })} /></div>

      <div className="form-section-heading"><span>05</span><div><h2>校园经历</h2><p>校园工作室经历及要点</p></div><button type="button" className="secondary-button" onClick={() => updateCampus({ bullets: [...resume.campus.bullets, ''] })}><Plus size={15} />添加要点</button></div>
      <div className="form-grid"><TextField label="经历标题" wide value={resume.campus.title} onChange={(title) => updateCampus({ title })} /><TextField label="时间" value={resume.campus.period} onChange={(period) => updateCampus({ period })} /><TextField label="组织" value={resume.campus.organization} onChange={(organization) => updateCampus({ organization })} /><TextField label="职位" value={resume.campus.role} onChange={(role) => updateCampus({ role })} /></div>
      <div className="resume-editor-list">{resume.campus.bullets.map((bullet, index) => <div className="resume-editor-item resume-bullet-item" key={`${index}-${bullet}`}><TextField label={`经历要点 ${index + 1}`} wide multiline value={bullet} onChange={(value) => updateCampus({ bullets: resume.campus.bullets.map((item, itemIndex) => itemIndex === index ? value : item) })} /><button type="button" className="remove-screenshot" onClick={() => updateCampus({ bullets: resume.campus.bullets.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button></div>)}</div>

      <div className="form-section-heading"><span>06</span><div><h2>项目经历</h2><p>简历中展示的项目内容，与前台作品项目独立维护</p></div><button type="button" className="secondary-button" onClick={() => onUpdate({ projects: [...resume.projects, { id: `resume-project-${Date.now()}`, title: '', type: '', year: '', description: '', role: '', software: '' }] })}><Plus size={15} />添加项目</button></div>
      <div className="resume-editor-list">{resume.projects.map((project, index) => <div className="resume-editor-item resume-project-item" key={project.id}><div className="resume-editor-item-heading"><strong>项目 {String(index + 1).padStart(2, '0')}</strong><button type="button" className="remove-screenshot" onClick={() => onUpdate({ projects: resume.projects.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button></div><div className="form-grid"><TextField label="项目名称" value={project.title} onChange={(title) => updateProject(index, { title })} /><TextField label="类型" value={project.type} onChange={(type) => updateProject(index, { type })} /><TextField label="年份" value={project.year} onChange={(year) => updateProject(index, { year })} /><TextField label="软件" value={project.software} onChange={(software) => updateProject(index, { software })} /><TextField label="项目描述" wide multiline value={project.description} onChange={(description) => updateProject(index, { description })} /><TextField label="职责" wide multiline value={project.role} onChange={(role) => updateProject(index, { role })} /></div></div>)}</div>

      <div className="form-section-heading"><span>07</span><div><h2>个人项目分类</h2><p>简历中个人项目区域的分类标题和说明</p></div><button type="button" className="secondary-button" onClick={() => onUpdate({ personalCategories: [...resume.personalCategories, { categoryId: `resume-category-${Date.now()}`, title: '', description: '' }] })}><Plus size={15} />添加分类</button></div>
      <div className="resume-editor-list">{resume.personalCategories.map((category, index) => <div className="resume-editor-item resume-project-item" key={`${category.categoryId}-${index}`}><div className="resume-editor-item-heading"><strong>分类 {String(index + 1).padStart(2, '0')}</strong><button type="button" className="remove-screenshot" onClick={() => onUpdate({ personalCategories: resume.personalCategories.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button></div><div className="form-grid"><TextField label="分类标题" value={category.title} onChange={(title) => updatePersonalCategory(index, { title })} /><TextField label="关联分类 ID" value={category.categoryId} onChange={(categoryId) => updatePersonalCategory(index, { categoryId })} /><TextField label="分类说明" wide multiline value={category.description} onChange={(description) => updatePersonalCategory(index, { description })} /></div></div>)}</div>
    </form>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await responseJson(await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }));
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <a href="/" className="login-back"><ArrowLeft size={16} /> 返回作品集</a>
      <form onSubmit={submit} className="login-panel">
        <div className="login-mark">XUE<span>®</span></div>
        <p className="admin-kicker">CONTENT STUDIO</p>
        <h1>内容管理</h1>
        <p>登录后可维护分类、项目资料、简历和媒体文件。</p>
        <label>管理员密码</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus autoComplete="current-password" placeholder="输入密码" />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading || !password}>{loading ? <LoaderCircle className="spin" size={17} /> : <ChevronRight size={17} />}进入后台</button>
        {process.env.NODE_ENV !== 'production' && <small>本地开发默认密码：admin</small>}
      </form>
    </main>
  );
}

export function AdminDashboard() {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [section, setSection] = useState<Section>('projects');
  const [selectedId, setSelectedId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    setAuthState('loading');
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      if (response.status === 401) { setAuthState('login'); return; }
      const loaded = await responseJson(response) as PortfolioContent;
      setContent(loaded);
      setSelectedId(loaded.projects[0]?.id || loaded.categories[0]?.id || '');
      setAuthState('ready');
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : '内容加载失败' });
      setAuthState('login');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedCategory = section === 'categories' ? content?.categories.find((item) => item.id === selectedId) : undefined;
  const selectedProject = section === 'projects' ? content?.projects.find((item) => item.id === selectedId) : undefined;
  const selectedResumeRole = section === 'resume' && resumeRoles.includes(selectedId as ResumeRole) ? selectedId as ResumeRole : undefined;
  const list = section === 'categories' ? content?.categories || [] : section === 'projects' ? content?.projects || [] : resumeRoles.map((role) => ({ id: role, title: content?.resume.roleLabels[role].label || role, enTitle: content?.resume.roleLabels[role].shortLabel || '' }));

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    content?.projects.forEach((item) => { counts[item.categoryId] = (counts[item.categoryId] || 0) + 1; });
    return counts;
  }, [content]);

  function mutate(updater: (current: PortfolioContent) => PortfolioContent) {
    setContent((current) => current ? updater(current) : current);
    setDirty(true);
    setNotice(null);
  }

  function updateCategory(patch: Partial<Category>) {
    if (!selectedCategory) return;
    mutate((current) => ({ ...current, categories: current.categories.map((item) => item.id === selectedCategory.id ? { ...item, ...patch } : item) }));
  }

  function updateProject(patch: Partial<Project>) {
    if (!selectedProject) return;
    mutate((current) => ({ ...current, projects: current.projects.map((item) => item.id === selectedProject.id ? { ...item, ...patch } : item) }));
  }

  function updateResume(patch: Partial<ResumeContent>) {
    if (!content) return;
    mutate((current) => ({ ...current, resume: { ...current.resume, ...patch } }));
  }

  function changeSection(next: Section) {
    setSection(next);
    if (next === 'resume') { setSelectedId(resumeRoles[0]); return; }
    const items = next === 'categories' ? content?.categories : content?.projects;
    setSelectedId(items?.[0]?.id || '');
  }

  function addItem() {
    if (!content) return;
    if (section === 'resume') return;
    if (section === 'categories') {
      const id = makeId('new-category', content.categories.map((item) => item.id));
      const category: Category = { id, title: '新分类', enTitle: 'NEW CATEGORY', description: '', cover: '', orientation: 'landscape' };
      mutate((current) => ({ ...current, categories: [...current.categories, category] }));
      setSelectedId(id);
    } else {
      if (!content.categories.length) { setNotice({ type: 'error', message: '请先新建一个分类' }); return; }
      const id = makeId('new-project', content.projects.map((item) => item.id));
      const project: Project = { id, categoryId: content.categories[0].id, title: '新项目', enTitle: 'NEW PROJECT', type: '', year: String(new Date().getFullYear()), duration: '', description: '', role: '', software: '', plugins: '', cover: '', video: '', screenshots: [] };
      mutate((current) => ({ ...current, projects: [...current.projects, project] }));
      setSelectedId(id);
    }
  }

  async function removeItem() {
    if (!content) return;
    if (section === 'resume') return;
    if (section === 'categories') {
      if (!selectedCategory) return;
      if (projectCounts[selectedCategory.id]) { setNotice({ type: 'error', message: '这个分类下还有项目，请先移动或删除相关项目' }); return; }
      if (!window.confirm(`确定删除分类“${selectedCategory.title}”吗？`)) return;
      const categories = content.categories.filter((item) => item.id !== selectedCategory.id);
      const saved = await saveContent({ ...content, categories }, '删除已保存');
      if (saved) setSelectedId(saved.categories[0]?.id || '');
    } else {
      if (!selectedProject || !window.confirm(`确定删除项目“${selectedProject.title}”吗？`)) return;
      const projects = content.projects.filter((item) => item.id !== selectedProject.id);
      const saved = await saveContent({ ...content, projects }, '删除已保存');
      if (saved) setSelectedId(saved.projects[0]?.id || '');
    }
  }

  function moveItem(direction: -1 | 1) {
    if (!content || section === 'resume') return;
    const key = section;
    const items = [...content[key]] as Array<Category | Project>;
    const index = items.findIndex((item) => item.id === selectedId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    mutate((current) => ({ ...current, [key]: items } as PortfolioContent));
  }

  async function saveContent(nextContent: PortfolioContent, successMessage = '内容已发布') {
    setSaving(true);
    setNotice(null);
    try {
      const saved = await responseJson(await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextContent) })) as PortfolioContent;
      setContent(saved);
      setDirty(false);
      setNotice({ type: 'ok', message: successMessage });
      return saved;
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : '保存失败' });
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!content) return;
    await saveContent(content);
  }

  async function logout() {
    if (dirty && !window.confirm('还有未保存的修改，仍要退出吗？')) return;
    await fetch('/api/admin/logout', { method: 'POST' });
    setContent(null);
    setAuthState('login');
  }

  if (authState === 'loading') return <main className="admin-loading"><LoaderCircle className="spin" /><p>正在载入内容</p></main>;
  if (authState === 'login') return <Login onSuccess={() => void load()} />;
  if (!content) return null;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <header><a href="/" className="admin-brand">XUE<span>®</span></a><span>CONTENT STUDIO</span></header>
        <nav aria-label="管理项目">
          <button type="button" className={section === 'projects' ? 'active' : ''} onClick={() => changeSection('projects')}><FolderKanban size={17} /><span>项目</span><em>{content.projects.length}</em></button>
          <button type="button" className={section === 'categories' ? 'active' : ''} onClick={() => changeSection('categories')}><ImageIcon size={17} /><span>分类</span><em>{content.categories.length}</em></button>
          <button type="button" className={section === 'resume' ? 'active' : ''} onClick={() => changeSection('resume')}><FileText size={17} /><span>简历</span><em>{resumeRoles.length}</em></button>
        </nav>
        <footer><a href="/" target="_blank"><ExternalLink size={15} />查看前台</a><button type="button" onClick={() => void logout()}><LogOut size={15} />退出</button></footer>
      </aside>

      <section className="admin-list-panel">
        <header><div><p>{section === 'projects' ? 'PROJECTS' : section === 'categories' ? 'CATEGORIES' : 'RESUME'}</p><h1>{section === 'projects' ? '项目' : section === 'categories' ? '分类' : '简历'}</h1></div>{section !== 'resume' && <button type="button" className="icon-button add-button" onClick={addItem} title={section === 'projects' ? '新建项目' : '新建分类'}><Plus size={18} /></button>}</header>
        <div className="admin-items">
          {list.map((item, index) => {
            const category = section === 'projects' ? content.categories.find((entry) => entry.id === (item as Project).categoryId) : null;
            return <button type="button" key={item.id} className={selectedId === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title || '未命名'}</strong><small>{category?.title || item.enTitle || '尚未填写'}</small></div><ChevronRight size={16} /></button>;
          })}
          {!list.length && <div className="admin-empty"><p>这里还没有内容</p><button type="button" onClick={addItem}><Plus size={16} />立即新建</button></div>}
        </div>
      </section>

      <section className="admin-editor">
        <header className="editor-toolbar">
          <div>{selectedCategory || selectedProject || selectedResumeRole ? <><span>{section === 'projects' ? 'EDIT PROJECT' : section === 'categories' ? 'EDIT CATEGORY' : 'EDIT RESUME'}</span><strong>{selectedProject?.title || selectedCategory?.title || content.resume.roleLabels[selectedResumeRole || resumeRoles[0]].label}</strong></> : <strong>选择一项开始编辑</strong>}</div>
          {(selectedCategory || selectedProject || selectedResumeRole) && <div className="toolbar-actions">{section !== 'resume' && <><MoveButtons index={list.findIndex((item) => item.id === selectedId)} total={list.length} onMove={moveItem} /><button type="button" className="danger-icon" onClick={removeItem} title="删除"><Trash2 size={16} /></button></>}<button type="button" className="save-button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? <LoaderCircle className="spin" size={16} /> : dirty ? <Save size={16} /> : <Check size={16} />}{saving ? '保存中' : dirty ? '发布修改' : '已保存'}</button></div>}
        </header>
        {notice && <div className={`admin-notice ${notice.type}`}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)}><X size={15} /></button></div>}

        <div className="editor-scroll">
          {selectedCategory && (
            <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-section-heading"><span>01</span><div><h2>分类信息</h2><p>分类名称、首页描述和识别信息</p></div></div>
              <div className="form-grid">
                <TextField label="分类名称" required value={selectedCategory.title} onChange={(title) => updateCategory({ title })} />
                <TextField label="英文名称" required value={selectedCategory.enTitle} onChange={(enTitle) => updateCategory({ enTitle })} />
                <div className="admin-field"><label>分类 ID<span>稳定标识</span></label><input value={selectedCategory.id} disabled /></div>
                <div className="admin-field"><label>项目数量</label><input value={`${projectCounts[selectedCategory.id] || 0} 个项目`} disabled /></div>
                <div className="admin-field"><label>视频方向<span>决定前台展示比例</span></label><select value={selectedCategory.orientation || 'landscape'} onChange={(event) => updateCategory({ orientation: event.target.value as Category['orientation'] })}><option value="landscape">横屏（16:9）</option><option value="portrait">竖屏（9:16）</option></select></div>
                <TextField label="分类描述" wide multiline value={selectedCategory.description} onChange={(description) => updateCategory({ description })} />
              </div>
              <div className="form-section-heading"><span>02</span><div><h2>分类封面</h2><p>首页分类拼贴中展示的主视觉</p></div></div>
              <MediaField label="封面图片" value={selectedCategory.cover} accept="image/*" onChange={(cover) => updateCategory({ cover })} hint="推荐 16:9 或更宽的横图，JPG / PNG / WebP" />
            </form>
          )}

          {selectedProject && (
            <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-section-heading"><span>01</span><div><h2>基本信息</h2><p>项目标题、分类和前台摘要</p></div></div>
              <div className="form-grid">
                <TextField label="项目标题" required value={selectedProject.title} onChange={(title) => updateProject({ title })} />
                <TextField label="英文标题" required value={selectedProject.enTitle} onChange={(enTitle) => updateProject({ enTitle })} />
                <div className="admin-field"><label>所属分类<span>必填</span></label><select value={selectedProject.categoryId} onChange={(event) => updateProject({ categoryId: event.target.value })}>{content.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></div>
                <TextField label="项目类型" value={selectedProject.type} onChange={(type) => updateProject({ type })} placeholder="例如：品牌短片" />
                <TextField label="年份" value={selectedProject.year} onChange={(year) => updateProject({ year })} />
                <TextField label="片长" value={selectedProject.duration} onChange={(duration) => updateProject({ duration })} placeholder="例如：01:42" />
                <TextField label="项目描述" wide multiline value={selectedProject.description} onChange={(description) => updateProject({ description })} />
              </div>
              <div className="form-section-heading"><span>02</span><div><h2>制作信息</h2><p>前台展示为亮点、职责和软件</p></div></div>
              <div className="form-grid three-columns">
                <TextField label="亮点" value={selectedProject.plugins} onChange={(plugins) => updateProject({ plugins })} placeholder="动态字幕 / 节奏设计" />
                <TextField label="职责" value={selectedProject.role} onChange={(role) => updateProject({ role })} placeholder="剪辑 / 调色" />
                <TextField label="软件" value={selectedProject.software} onChange={(software) => updateProject({ software })} placeholder="Premiere Pro / Resolve" />
              </div>
              <div className="form-section-heading"><span>03</span><div><h2>主媒体</h2><p>视频封面和完整视频，可上传或使用外链</p></div></div>
              <div className="media-fields-grid">
                <MediaField label="视频封面" value={selectedProject.cover} accept="image/*" onChange={(cover) => updateProject({ cover })} hint="推荐 16:9 横图" />
                <MediaField label="项目视频" value={selectedProject.video} accept="video/*" onChange={(video) => updateProject({ video })} onVideoPoster={(cover) => { if (!selectedProject.cover) updateProject({ cover }); }} onVideoScreenshots={(screenshots) => { if (!selectedProject.screenshots.length) updateProject({ screenshots }); }} hint="支持 MP4 / WebM / MOV，自动截取首帧封面和 4 张随机截图，均可手动替换" />
                <GeneratePosterButton videoUrl={selectedProject.video} onGenerated={(cover) => updateProject({ cover })} />
              </div>
              <div className="form-section-heading"><span>04</span><div><h2>项目截图</h2><p>可添加、删除和调整展示顺序，最多 12 张</p></div><button type="button" className="secondary-button" disabled={selectedProject.screenshots.length >= 12} onClick={() => updateProject({ screenshots: [...selectedProject.screenshots, ''] })}><Plus size={15} />添加截图</button></div>
              <div className="screenshot-fields">
                {selectedProject.screenshots.map((screenshot, index) => (
                  <div className="screenshot-item" key={index}>
                    <div className="screenshot-index"><span>{String(index + 1).padStart(2, '0')}</span><div className="move-buttons"><button type="button" className="icon-button" disabled={index === 0} onClick={() => { const next = [...selectedProject.screenshots]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateProject({ screenshots: next }); }}><ArrowUp size={14} /></button><button type="button" className="icon-button" disabled={index === selectedProject.screenshots.length - 1} onClick={() => { const next = [...selectedProject.screenshots]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; updateProject({ screenshots: next }); }}><ArrowDown size={14} /></button></div></div>
                    <MediaField label={`截图 ${index + 1}`} value={screenshot} accept="image/*" onChange={(value) => { const screenshots = [...selectedProject.screenshots]; screenshots[index] = value; updateProject({ screenshots }); }} />
                    <button type="button" className="remove-screenshot" onClick={() => updateProject({ screenshots: selectedProject.screenshots.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button>
                  </div>
                ))}
                {!selectedProject.screenshots.length && <div className="screenshots-empty"><ImageIcon size={22} /><p>还没有项目截图</p></div>}
              </div>
            </form>
          )}

          {selectedResumeRole && <ResumeEditor resume={content.resume} role={selectedResumeRole} onUpdate={updateResume} />}
        </div>
      </section>
    </main>
  );
}
