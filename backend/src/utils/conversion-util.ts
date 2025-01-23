export const convertInputToOutput = (input: string): string => {
  // Extract title
  const titleMatch = input.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : "Untitled Page";

  // Extract components
  const componentMatches =
    input.match(/<component>([\s\S]*?)<\/component>/g) || [];
  const components: string[] = [];
  for (const component of componentMatches) {
    const nameMatch = component.match(
      /<component_name>([\s\S]*?)<\/component_name>/,
    );
    const descriptionMatches = component.matchAll(
      /<component_description>([\s\S]*?)<\/component_description>/g,
    );

    const componentName = nameMatch ? nameMatch[1] : "Unnamed Component";
    const descriptions = [...descriptionMatches].map((d) => d[1]);
    if (descriptions.length === 1) {
      components.push(`${componentName}: ${descriptions[0]}`);
    } else if (descriptions.length > 1) {
      components.push(`${componentName}:\n  - ${descriptions.join("\n  - ")}`);
    } else {
      components.push(componentName);
    }
  }

  // Extract interactions
  const interactionMatches = input.matchAll(
    /<interaction_number>(.*?)<\/interaction_number>/g,
  );
  const interactions: string[] = [...interactionMatches].map(
    (match) => match[1],
  );

  // Format output
  const outputLines: string[] = [];
  outputLines.push(`# Screen Interaction Documentation\n`);
  outputLines.push(`## ${title}\n`);
  outputLines.push(`### Components`);
  components.forEach((component) => outputLines.push(`- ${component}`));
  outputLines.push(`\n### Interactions`);
  interactions.forEach((interaction, index) =>
    outputLines.push(`${index + 1}. ${interaction}`),
  );

  return `${outputLines.join("\n")}`;
};
