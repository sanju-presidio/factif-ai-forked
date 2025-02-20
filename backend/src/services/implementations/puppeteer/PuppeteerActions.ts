import * as puppeteer from "puppeteer";
import { Server as SocketServer } from "socket.io";
import {
  IClickableElement,
  IPlaywrightAction,
} from "../../interfaces/BrowserService";
import { Page } from "playwright";

export class PuppeteerActions {
  private static io: SocketServer;

  static initialize(io: SocketServer) {
    PuppeteerActions.io = io;
  }

  static async click(page: Page, action: IPlaywrightAction): Promise<any> {
    if (!action || !action.coordinate) {
      return "Coordinates are required for click action";
    }

    const res = await page.evaluate((action) => {
      function checkIfIntendedElement(
        collectedElement: Element,
        actualElement: IClickableElement,
      ) {
        const randomAttribute = Object.keys(actualElement.attributes)[
          Math.floor(
            Math.random() * Object.keys(actualElement.attributes).length,
          )
        ];
        return (
          collectedElement.tagName?.toLowerCase() ===
            actualElement.tagName?.toLowerCase() &&
          collectedElement?.textContent === actualElement?.text &&
          actualElement.attributes[randomAttribute]?.toLowerCase() ===
            collectedElement.getAttribute(randomAttribute)?.toLowerCase()
        );
      }

      try {
        const element = document.elementFromPoint(
          action!.coordinate!.x,
          action!.coordinate!.y,
        ) as Element;
        const { top } = element.getBoundingClientRect();
        const isValidElement = checkIfIntendedElement(
          element,
          action!.element as IClickableElement,
        );
        console.log("==========", element.tagName);
        console.log("============= valid element? ", isValidElement);

        if (top > window.innerHeight || top < window.scrollY) {
          element.scrollIntoView({ behavior: "smooth" });
        }
        console.log(
          top,
          "==",
          top > window.innerHeight || top < window.scrollY,
        );
        return {
          top,
          isSuccess: true,
          isConditionPassed: top > window.innerHeight || top < window.scrollY,
        };
      } catch (e) {
        console.log(
          "Error while clicking on element. Please check if the element is visible in the current viewport",
          e,
        );
        return {
          isSuccess: false,
          message:
            "Element not available on the visible viewport. Please check if the element is visible in the current viewport otherwise scroll the page to make the element visible in the viewport",
        };
      }
    }, action);
    if (!res.isSuccess) {
      return res.message;
    }

    try {
      await page.mouse.move(action.coordinate.x, action.coordinate.y);
      await page.mouse.click(action.coordinate.x, action.coordinate.y, {
        button: "left",
        clickCount: 1,
      });
      // Create a navigation promise that resolves on load or times out after 5 seconds
      await page.waitForLoadState("domcontentloaded", {
        timeout: 20_000,
      });

      // Wait for both navigation and click to complete

      return "Click action performed successfully";
    } catch (e) {
      console.error("Click action error:", e);
      return "Click action failed. Please retry";
    }
  }

  static async type(page: Page, action: IPlaywrightAction): Promise<any> {
    if (!action) {
      throw new Error("Text is required for type action");
    }

    const isElementFocused = await page.evaluate((action) => {
      const el = document.elementFromPoint(
        action!.coordinate!.x,
        action!.coordinate!.y,
      );
      return el === document.activeElement;
    }, action);
    if (isElementFocused) {
      await page.keyboard.type(action!.text as string);
      return "Type action performed successfully";
    } else {
      return "Element is not focused. Please click on the element first.";
    }
  }

  static async back(page: Page): Promise<string> {
    try {
      if (!page) {
        return "Browser not launched";
      }

      await page.goBack();

      // After navigation, emit the new URL
      const currentUrl = page.url();
      PuppeteerActions.io?.sockets.emit("url-change", currentUrl);
      PuppeteerActions.io?.sockets.emit("action_performed");

      return "Navigated back successfully";
    } catch (error: any) {
      console.error("Failed to navigate back:", error);
      return "Failed to navigate back";
    }
  }

  static async keyPress(
    page: Page,
    action: IPlaywrightAction,
  ): Promise<string> {
    if (!action.text) return "Text is required for keypress action";
    const isFocused = await page.evaluate((action) => {
      const el = document.elementFromPoint(
        action!.coordinate!.x,
        action!.coordinate!.y,
      );
      return el === document.activeElement;
    }, action);
    if (isFocused) {
      let newKey = action.text;
      if (action.text.includes("control")) {
        newKey = action.text.toLowerCase().replace("control", "ControlOrMeta");
      }
      await page.keyboard.press(newKey, { delay: 10 });
      return "Keypress action performed successfully";
    } else {
      return "Element is not focused. Please click on the element first.";
    }
  }

  static async scrollUp(page: Page): Promise<string> {
    await page.mouse.wheel(0, -200);
    return "Scroll up action performed successfully";
  }

  static async scrollDown(page: Page): Promise<string> {
    await page.mouse.wheel(0, 200);
    return "Scroll up action performed successfully";
  }

  // page.goto { waitUntil: "networkidle0" } may not ever resolve, and not waiting could return page content too early before js has loaded
  // https://stackoverflow.com/questions/52497252/puppeteer-wait-until-page-is-completely-loaded/61304202#61304202
  private static async waitTillHTMLStable(
    page: puppeteer.Page,
    timeout = 5_000,
  ) {
    const checkDurationMsecs = 500; // 500
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while (checkCounts++ <= maxChecks) {
      let html = await page.content();
      let currentHTMLSize = html.length;

      // let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length)
      console.log("last: ", lastHTMLSize, " <> curr: ", currentHTMLSize);

      if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
        countStableSizeIterations++;
      } else {
        countStableSizeIterations = 0; //reset the counter
      }

      if (countStableSizeIterations >= minStableSizeIterations) {
        console.log("Page rendered fully...");
        break;
      }

      lastHTMLSize = currentHTMLSize;
      await new Promise((resolve) => setTimeout(resolve, checkDurationMsecs));
    }
  }
}
