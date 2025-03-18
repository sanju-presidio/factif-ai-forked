# Changelog

## 1.3.0

### Minor Changes

- ### Features

  - **Integrated OmniParser v2:** Delivers enriched, annotated screenshots to the LLM, enabling more informed decision-making for task execution
  - **Automated Playwright Installation:** Playwright binaries now automatically install after `npm install`, streamlining the setup process.
  - **Factifai Logo Added:** Improved visual identity with the addition of the Factifai logo.
  - **OpenAI Support for Explore Mode:** Explore mode now supports OpenAI models, expanding LLM options and capabilities.
  - **Chat History and Persistence:** Added chat history tracking with file storage persistence, allowing users to revisit previous conversations.


  **Bug Fixes:**

  - **LLM Context Isolation:** Resolved context contamination between different operating modes, ensuring accurate and isolated responses.
  - **Chat Context Management:** Implemented context management to prevent exceeding LLM token limits on complex websites.
  - **Explore Mode Graph Fix:** Corrected a bug causing incorrect graph rendering in explore mode.
  - **Seamless VNC Mode Switching:** Resolved issues with VNC mode switching, ensuring a smoother user experience.
  - **Incorrect Timestamp:** The history displays the last accessed time instead of the creation time. This makes it difficult to track the chronological order of conversations.
  - **Incorrect URL Display:** The URL bar does not always accurately reflect the active URL being displayed in the browser preview.
  - **Graph Refresh on History Switch:** The graph does not refresh when switching between different entries in the chat history. This results in the graph displaying the information from the previously viewed history item, rather than the currently selected one.
  - **Real-time Graph Updates:** The graph does not update in real-time. It only updates when the user switches between the browser preview and the chat interface. This delay hinders the user's ability to observe immediate changes in the website structure.
  - **Missing Screenshots:** Occasionally, the graph renders without an associated screenshot, leading to incomplete visualizations.

  **Enhancements:**

  - **UX Improvements:** General UX enhancements implemented to improve usability and overall user experience.
  - **Screenshot on History Load**: Implement the functionality to display a screenshot within the graph when loading a chat history entry. This would provide visual context for past interactions


## 1.2.0

### New Feature: Explore Mode

- **Explore Chat**: Specialized chat interface for Click-through exploration of interconnected web content of a website.
- **Graph View**: Visual representation of web pages and their relationships for easier navigation and understanding of site structure
- **Page Node System**: Interactive page nodes that display content and allow navigation between related pages
- **Recent Chats**: Easy access to previous explore mode conversations

## 1.1.0

### Enhancements

- Added browser centric approach on the puppeteer mode.
- General improvements & bugfixes

## 1.0.0

### Built-in support for leading vision-language models:

- **Claude**: Anthropic's advanced vision and reasoning model
- **OpenAI**: GPT-4o with visual understanding capabilities
- **Gemini**: Google's multimodal AI for computer interaction
- **[OmniParser](https://github.com/microsoft/OmniParser)**: Screen Parsing tool for Pure Vision Based GUI Agent

### AI-Powered Computer Control

- Intelligent element detection and navigation
- Automated verification and validation
- Comprehensive test documentation with automated screenshot capture for each step
- Integrated test case export with visual step-by-step documentation
