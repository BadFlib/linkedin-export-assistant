const { JSDOM } = require("jsdom");

describe("JSDOM DOM Manipulation Test", () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  test("should be able to append an element to the body", () => {
    const div = document.createElement("div");
    div.className = "test-div";
    div.textContent = "Hello, world!";
    document.body.appendChild(div);

    const appendedDiv = document.querySelector(".test-div");
    expect(appendedDiv).not.toBeNull();
    expect(appendedDiv.textContent).toBe("Hello, world!");
  });
});

