import fs from "fs";
import path from "path";

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
    outputLines.push(`${interaction}`),
  );

  return `${outputLines.join("\n")}`;
};

/**
 * Saves a content file and a screenshot image to the specified directory.
 *
 * @param {string} fileName - The base name for the files to be saved (without extension).
 * @param {string} screenshot - The base64-encoded string representing the screenshot image.
 * @param {string} directory - The directory path where the files will be saved.
 * @param {string} content - The text content to be written in the file.
 * @return {Promise<void>} A promise that resolves when both the file and the screenshot are successfully saved, or rejects if an error occurs.
 */
export async function saveFileAndScreenshot(
  fileName: string,
  screenshot: string | null,
  directory: string,
  content: string,
): Promise<void> {
  try {
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write the content to a file
    const filePath = path.join(directory, `${fileName}.md`);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`File saved at: ${filePath}`);

    if (screenshot) {
      // Save the screenshot as an image
      const screenshotPath = path.join(directory, `${fileName}.jpg`);
      const base64Data = screenshot.replace(/^data:image\/jpeg;base64,/, ""); // Remove base64 header
      fs.writeFileSync(screenshotPath, base64Data, "base64");
      console.log(`Screenshot saved at: ${screenshotPath}`);
    }
  } catch (error: any) {
    console.error(`Error saving file and screenshot: ${error?.message}`);
    throw error;
  }
}
