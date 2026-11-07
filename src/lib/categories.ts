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

export function categoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    automata: 'Finite state machines in C#: deterministic and nondeterministic implementations, powerset construction, and minimization.',
    'theory-of-computation': 'Explore the theory behind finite state machines, from nondeterminism and equivalence to powerset construction and minimization.',
    csharp: 'C# tutorials with working examples of finite state machines, algorithms, and practical implementation choices.',
    dotnet: 'Notes on building software with .NET, including C# implementations of finite state machines and algorithms.',
    excel: 'Excel development tips: exploring the object model, diagnosing bugs, and working around unexpected behavior.',
    'excel-bug': 'Excel object model bugs explained with examples and workarounds for colors, panes, and other unexpected behavior.',
    color: 'Working with colors in Excel: understanding RGB values and unexpected behavior in the object model.',
    vsto: 'Excel development with Visual Studio Tools for Office, including object model pitfalls and practical workarounds.',
    programming: 'Practical software development notes, including setting up Git and choosing tools for Visual Studio.',
    'source-control': 'Getting started with source control in Visual Studio, with Git workflows and tools for managing code changes.',
    git: 'Using Git with Visual Studio: getting started, choosing a client, and working with version control.',
    octopress: 'Customizing an Octopress blog, including a historical guide to adding social sharing buttons.',
    blog: 'Notes on customizing a personal blog with Octopress, including a historical social sharing tutorial.',
    social: 'A historical look at adding social sharing buttons to an Octopress blog with AddThis.',
  };
  return descriptions[canonicalCategorySlug(category)] ?? `Articles about ${categoryLabel(category)} by Mitja Bezenšek.`;
}
