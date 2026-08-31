export type Category = {
  id: string;
  title: string;
  enTitle: string;
  description: string;
  cover: string;
};

export type Project = {
  id: string;
  categoryId: string;
  title: string;
  enTitle: string;
  type: string;
  year: string;
  duration: string;
  description: string;
  role: string;
  software: string;
  plugins: string;
  cover: string;
  video: string;
  screenshots: string[];
};

export type PortfolioContent = {
  categories: Category[];
  projects: Project[];
  updatedAt: string;
};
