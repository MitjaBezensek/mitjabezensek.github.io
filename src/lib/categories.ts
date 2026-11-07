export function categorySlug(category: string): string {
  return category.toLowerCase().trim().replace(/\s+/g, '-');
}

export function canonicalCategorySlug(category: string): string {
  const slug = categorySlug(category);
  return slug === 'excel-excel' ? 'excel' : slug;
}

export function categoryLabel(category: string): string {
  const slug = canonicalCategorySlug(category);
  const labels: Record<string, string> = { csharp: 'C#', dotnet: '.NET', vsto: 'VSTO', git: 'Git', octopress: 'Octopress' };
  const words = slug.replaceAll('-', ' ');
  return labels[slug] ?? words.charAt(0).toUpperCase() + words.slice(1);
}

export function categoryTopics(categories: string[]) {
  return [...new Set(categories.map(canonicalCategorySlug))].map(slug => ({ slug, name: categoryLabel(slug) }));
}
