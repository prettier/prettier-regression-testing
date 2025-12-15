import prettyMilliseconds from "pretty-ms";
import styleText from "node-style-text";

const START_PREFIX = styleText.bgGray("[START]");
const END_PREFIX = styleText.bgGreen("[ END ]");

class Timing {
  #message;
  #startMark: PerformanceMark | undefined;

  constructor(message: string) {
    this.#message = message;
    this.#startMark = performance.mark("start");
    console.log(`${START_PREFIX}: ${message}`);
  }

  end(message?: string) {
    const { duration } = performance.measure(this.#message, this.#startMark);
    console.log(
      (message ?? `${END_PREFIX}: ${this.#message}`) +
        ` (${styleText.blue.underline(prettyMilliseconds(duration))})`,
    );
  }
}

export { Timing };
