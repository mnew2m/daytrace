"use client";

import { useMemo, useState } from "react";
import { categories as defaultCategories } from "@/lib/data";
import { categoryPalettes, getCategoryPalette, mixHex, type CategoryPaletteId } from "@/lib/category-palettes";
import type { Category, CategorySlug, UpdateCategoryInput } from "@/lib/types";

export function useCategoryPalette({
  initialCategories = defaultCategories,
  initialPaletteId = "default",
  savePalette,
  saveCategory
}: {
  initialCategories?: Category[];
  initialPaletteId?: string;
  savePalette?: (paletteId: CategoryPaletteId, categories: UpdateCategoryInput[]) => Promise<void>;
  saveCategory?: (input: UpdateCategoryInput) => Promise<void>;
} = {}) {
  const [paletteId, setPaletteIdState] = useState<CategoryPaletteId>(getCategoryPalette(initialPaletteId).id);
  const [categoryList, setCategoryList] = useState<Category[]>(initialCategories);
  const categoryById = useMemo(() => Object.fromEntries(categoryList.map((category) => [category.id, category])) as Record<CategorySlug, Category>, [categoryList]);

  function setPaletteId(nextPaletteId: CategoryPaletteId) {
    const palette = getCategoryPalette(nextPaletteId);
    const nextCategories = categoryList.map((category, index) => withColor(category, palette.colors[index] ?? palette.colors[palette.colors.length - 1]));
    const updates = nextCategories.map((category) => pickCategoryUpdate(category));

    setPaletteIdState(nextPaletteId);
    setCategoryList(nextCategories);
    void savePalette?.(nextPaletteId, updates);
  }

  function updateCategoryItem(categoryId: CategorySlug, nextItem: { label: string; emoji: string }) {
    if (categoryId === "sleep") return;

    const current = categoryById[categoryId];
    const nextCategory = {
      ...current,
      label: nextItem.label.trim() || current.label,
      emoji: nextItem.emoji.trim() || current.emoji
    };
    setCategoryList((currentCategories) => currentCategories.map((category) => (category.id === categoryId ? nextCategory : category)));
    void saveCategory?.(pickCategoryUpdate(nextCategory));
  }

  function updateCategoryColor(categoryId: CategorySlug, color: string) {
    const nextCategory = withColor(categoryById[categoryId], color);
    setCategoryList((currentCategories) => currentCategories.map((category) => (category.id === categoryId ? nextCategory : category)));
    void saveCategory?.(pickCategoryUpdate(nextCategory));
  }

  return {
    paletteId,
    palettes: categoryPalettes,
    categories: categoryList,
    categoryById,
    setPaletteId,
    updateCategoryItem,
    updateCategoryColor
  };
}

function withColor(category: Category, color: string) {
  return {
    ...category,
    color,
    tint: mixHex(color, "#ffffff", 0.82),
    stroke: mixHex(color, "#1f2723", 0.38)
  };
}

function pickCategoryUpdate(category: Category): UpdateCategoryInput {
  return {
    id: category.id,
    label: category.label,
    emoji: category.emoji,
    color: category.color,
    tint: category.tint,
    stroke: category.stroke
  };
}
