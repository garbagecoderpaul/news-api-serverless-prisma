import { News, PrismaClient } from '@prisma/client';
import AppError from '../../../shared/errors/appError';

const prisma = new PrismaClient();

interface IRequest {
  id: string;
  hat: string;
  title: string;
  text: string;
  author: string;
  image: string;
  link: string;
  isActive: boolean;
  categoryIds?: string[];
  categoriesToRemove?: string[];
}

export default class UpdateNewsService {
  public async execute({
    id,
    hat,
    title,
    text,
    author,
    image,
    link,
    isActive,
    categoryIds,
    categoriesToRemove,
  }: IRequest): Promise<News> {
    const news = await prisma.news.findUnique({
      where: {
        id: id,
      },
      include: {
        categories: true,
      },
    });

    if (!news) {
      throw new AppError('Notícia não encontrada');
    }

    if (categoryIds) {
      const existingCategoryIds = news.categories.map(
        (category) => category.id,
      );
      const duplicateCategories = categoryIds.filter((categoryId) =>
        existingCategoryIds.includes(categoryId),
      );

      if (duplicateCategories.length > 0) {
        throw new AppError('Esta categoria já está associada a esta notícia.');
      }
    }

    // Remove as categorias especificadas
    if (categoriesToRemove) {
      const categoryIdsToRemove = categoriesToRemove; // Remover as categorias diretamente

      await prisma.news.update({
        where: {
          id: id,
        },
        data: {
          categories: {
            disconnect: categoryIdsToRemove.map((categoryId) => ({
              id: categoryId,
            })),
          },
        },
      });
    }

    const updatedNews = await prisma.news.update({
      where: {
        id: id,
      },
      data: {
        hat: hat,
        title: title,
        text: text,
        author: author,
        image: image,
        link: link,
        isActive: isActive,
        categories: {
          connect: categoryIds?.map((categoryId) => ({ id: categoryId })) || [],
        },
      },
      include: {
        categories: true,
      },
    });

    return updatedNews;
  }
}
