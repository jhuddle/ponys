# Ponys 🦄
Declarative creation of browser-native web components.

**CDN:** [https://cdn.jsdelivr.net/gh/jhuddle/ponys/miniature-ponys.js](https://cdn.jsdelivr.net/gh/jhuddle/ponys/miniature-ponys.js)

## Ponys simplifies the process of creating custom elements.

Making new [browser-native web components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) typically comes with a lot of boilerplate:
```js
/* hello-world.js */

const templateString = `
  Hello, <slot>world</slot>!
`;
const templateElement = document.createElement('template');
templateElement.innerHTML = templateString;

class HelloWorld extends HTMLElement {

  constructor() {
    let content = templateElement.content.cloneNode(true);
    let shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.append(content);
  }

}

customElements.define('hello-world', HelloWorld);
```
when all you really wanted to do was write this once somewhere:
```js
<template name="hello-world">
  Hello, <slot>world</slot>!
</template>
```
so that you can use _this_ everywhere else:
```html
<hello-world></hello-world>

<hello-world>everypony</hello-world>
```
```
Hello, world! Hello, everypony!
```
Wouldn't it be cool if browsers let you do that? 🤔

## This is what Ponys allows you to do - in three different ways!

- Detect any [`<template>`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots) elements that have a `name` attribute, and promote them to [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements):
```html
<script type="module">
  import Ponys from './ponys.js';
  Ponys.defineAll();
</script>

...

<template name="hello-world">
  Hello, <slot>world</slot>!
</template>
```
- Define a custom element by passing its name and its content as a string:
```js
/* app.js */

import Ponys from './ponys.js';

Ponys.define('hello-world', 'Hello, <slot>world</slot>!');
```
- Import the content for a new custom element from a separate file:
```html
<!-- hello-world.html -->

Hello, <slot>world</slot>!
```
```js
/* app.js */

import Ponys from './ponys.js';

Ponys.import('hello-world', './components/hello-world.html');
```
That's correct: you can inline your templates server-side, create them dynamically, or import them as single-file components - each of these snippets results in the same custom element.

## But what about interactivity, styling, etc?

Any class you can use with [`customElements.define()`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define), you can use with Ponys. Just add a `<script>` tag inside your template tag/string/file, and [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) the class that contains your properties and methods as default - no constructor required.

Likewise with `<style>`! Ponys will put your component's elements behind a [shadow root](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) wherever possible, so your CSS is fully encapsulated.

Here's an example of an inline template with a `<script>` tag, which extends the built-in `<button>` element:

**Counter button**
```html
<template name="counter-button" extends="button">

  Count: <b id="count"></b>

  <script>
    export default class extends HTMLButtonElement {

      count = 0

      update() {
        this.$('#count').textContent = this.count;
      }

      increment() {
        this.count++;
        this.update();
      }

      connectedCallback() {
        this.onclick = event => this.increment();
        this.update();
      }

    }
  </script>

</template>
```
```html
<style>
  [is="counter-button"] {
    font-size: 1rem;
    font-family: monospace;
  }
</style>

<button is="counter-button" style="color: white; background: crimson"></button>
<button is="counter-button" style="color: white; background: seagreen"></button>
```
Note also that this template uses a special convenience method on the 'host' element of our component: `this.$('#count')` is equivalent to `this.shadowRoot.querySelector('#count')`. And what's more, every element defined in the template _also_ has access to this method - as well as `$$` for `querySelectorAll`, plus a `host` property that points directly at the host element - making it really easy for elements to reference each other within the current component.

With this capability, you can do a lot with relatively little JavaScript. Here's another more complicated example, this time imported as a single-file component:

**Modal**
```html
<!-- modal-container.html -->

<div
  id="container"
  onclick="event.stopPropagation(); host.close()"
  onkeydown="event.stopPropagation(); if (event.key === 'Escape') host.close()"
>
  <article
    id="modal"
    part="modal"
    aria-modal="true"
    tabindex="-1"
    onclick="event.stopPropagation()"
  >

    <slot></slot>

    <div
      id="controls"
      part="controls"
    >
      <button type="button"
        title="Close"
        onclick="host.close()"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  </article>
</div>

<script>
  export default class extends HTMLElement {

    close() {
      this.hidden = true;
    }

  }
</script>

<style>

  :host {
    z-index: 9999;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  #container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  #modal {
    overflow-y: auto;
    overscroll-behavior: none;
    position: relative;
    background: white;
  }

  #controls {
    position: absolute;
    top: 0;
    right: 0;
    width: 3rem;
    height: 3rem;
    font-size: 2rem;
  }

  button {  /* reset */
    cursor: pointer;
    border: unset;
    margin: unset;
    padding: unset;
    background: unset;
    color: unset;
    font: unset;
  }
  button {
    position: fixed;
    width: inherit;
    height: inherit;
  }

</style>
```
```js
/* app.js */

import Ponys from './ponys.js';

Ponys.import('modal-container', './components/modal-container.html');
```
```html
<style>
  modal-container {
    transition: all 0.2s linear;
    backdrop-filter: blur(2px);
  }
  modal-container[hidden] {
    display: unset;
    visibility: hidden;
    opacity: 0;
  }
  modal-container::part(modal) {
    max-width: 100vmin;
    margin: 2rem;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0.25rem 0.25rem 0.5rem rgba(0, 0, 0, 0.25);
  }
</style>

<button type="button" onclick="nextElementSibling.hidden = false">Open modal</button>

<modal-container hidden>
  <b>What the frameworks say:</b>
  <blockquote>
    Well, well, well. It seems we have some <em>neigh</em>-sayers in the audience.
    Who is so ignorant as to challenge the magical ability of the
    Great and Powerful Trixie? Do they not know that they're in the
    presence of the most magical unicorn in all of Equestria?
  </blockquote>
  <button type="button" onclick="parentElement.hidden = true">Close</button>
</modal-container>
```
Try adding some of the other custom elements defined above inside the `<modal-container>` tag - you'll see they work perfectly alongside the other elements rendered in our template's [`<slot>`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots).

## How can I use this with other JS code though?

Just [`import`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) it! The `<script>` tag in your template is treated as being of `type="module"`, which means you can use any library that's written as an [ESM module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules): of course, you can import modules directly from your site's static assets, but you could also fetch libraries as needed from a CDN such as [Skypack](https://www.skypack.dev/) or [esm.run](https://esm.run/) by jsDelivr.

That's the approach taken in the example below: here, we import an ESM build of [PapaParse](https://github.com/mholt/PapaParse) from a CDN, in order to parse our custom element's text content as a CSV string. The rest of our code builds an HTML table from the resulting data object... click on the headers to sort by column!

**CSV table**
```html
<!-- csv-table.html -->

<table></table>

<script>
  import Papa from 'https://cdn.jsdelivr.net/npm/papaparse/+esm';

  export default class extends HTMLElement {

    sortDir = 1  // +ve = ascending, -ve = descending
    sortCol = null

    render()
    {
      let table = this.$('table');
      table.innerHTML = '';

      if (this.header && this.data.length) {
        let row = table.createTHead().insertRow();
        this.data[0].forEach((value, col) => {
          let cell = document.createElement('th');
          cell.scope = 'col';
          cell.tabIndex = 0;
          cell.setAttribute('role', 'button');
          cell.title = 'Sort by '+ value;
          cell.textContent = value;
          cell.onclick = () => {
            this.sortDir = this.sortCol == col ? -this.sortDir : 1;
            this.sortCol = col;
            this.render();
          };
          cell.onkeydown = event => event.key === 'Enter' ? cell.click() : null;
          row.append(cell);
        });
      }

      let tbody = table.createTBody();
      let sortFunc = (a,b) => this.sortDir * (a[this.sortCol] > b[this.sortCol] ? 1 : -1);
      for (let record of this.data.slice(this.header).sort(sortFunc)) {
        let row = tbody.insertRow();
        record.forEach(value => row.insertCell().textContent = value);
      }
    }

    connectedCallback()
    {
      this.data = Papa.parse(this.textContent, {
        skipEmptyLines: true,
        transform: value => value.trim()
      }).data;

      this.header = this.hasAttribute('header');

      this.render();
    }

  }
</script>

<style>

  :host {
    display: table;
  }

  :host([border]) * {
    border: 1px solid gainsboro;
  }

  table {
    border-collapse: collapse;
    text-align: left;
  }

  th, td {
    padding: 0.25em 0.5em;
  }

  th {
    cursor: pointer;
  }

</style>
```
```js
/* app.js */

import Ponys from './ponys.js';

Ponys.import('csv-table', './components/csv-table.html');
```
```html
<csv-table
  header
  border
  style="
    box-shadow: 0.25rem 0.25rem 0.5rem rgba(0, 0, 0, 0.25);
    background: white;
    color: crimson;
  "
>
  Character;Kind;Element of Harmony
  Twilight Sparkle;Alicorn;Magic
  Pinkie Pie;Earth;Laughter
  Fluttershy;Pegasus;Kindness
  Rainbow Dash;Pegasus;Loyalty
  Rarity;Unicorn;Generosity
  Applejack;Earth;Honesty
</csv-table>
```

## Nice, but I'm more familiar with reactive components...

No worries: the progressive-enhancement ecosystem has got you covered. Here's the exact same CSV table, but written with [petite-vue](https://github.com/vuejs/petite-vue); if you know regular Vue, you'll already know how it works. You could do much the same thing with [Alpine.js](https://github.com/alpinejs/alpine) too, for example. Or perhaps my next side-project... 😉

**CSV table using petite-vue**
```html
<!-- csv-table-vue.html -->

<table>
  <thead v-if="header">
    <tr>
      <th v-for="value, col in data[0]"
        scope="col"
        tabindex="0"
        role="button"
        :title="'Sort by '+ value"
        @click="sort(col)"
        @keydown="$event.key === 'Enter' && $el.click()"
      >{{ value }}</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="row in data.slice(header)">
      <td v-for="value in row">{{ value }}</td>
    </tr>
  </tbody>
</table>

<script>
  import Papa from 'https://cdn.jsdelivr.net/npm/papaparse/+esm';
  import * as PetiteVue from 'https://cdn.jsdelivr.net/npm/petite-vue/+esm';

  export default class extends HTMLElement {

    connectedCallback()
    {
      const host = this;

      PetiteVue.createApp({

        data: Papa.parse(host.textContent, {
          skipEmptyLines: true,
          transform: value => value.trim()
        }).data,

        get header() {
          return host.hasAttribute('header');
        },

        sortDir: 1,  // +ve = ascending, -ve = descending
        sortCol: null,

        sort(col) {
          this.sortDir = this.sortCol === col ? -this.sortDir : 1;
          this.sortCol = col;
          let sortFunc = (a,b) => this.sortDir * (a[this.sortCol] > b[this.sortCol] ? 1 : -1);
          this.data = [this.data[0], ...this.data.slice(1).sort(sortFunc)];
        },

      }).mount(host.$('table'));
    }

  }
</script>

<style>

  :host {
    display: table;
  }

  :host([border]) * {
    border: 1px solid gainsboro;
  }

  table {
    border-collapse: collapse;
    text-align: left;
  }

  th, td {
    padding: 0.25em 0.5em;
  }

  th {
    cursor: pointer;
  }

</style>
```
```js
/* app.js */

import Ponys from './ponys.js';

Ponys.import('csv-table-vue', './components/csv-table-vue.html');
```
```html
<csv-table-vue
  header
  border
  style="
    box-shadow: 0.25rem 0.25rem 0.5rem rgba(0, 0, 0, 0.25);
    background: white;
    color: seagreen;
  "
>
  Character;Kind;Element of Harmony
  Twilight Sparkle;Alicorn;Magic
  Pinkie Pie;Earth;Laughter
  Fluttershy;Pegasus;Kindness
  Rainbow Dash;Pegasus;Loyalty
  Rarity;Unicorn;Generosity
  Applejack;Earth;Honesty
</csv-table-vue>
```

## But how do I...

- _...choose not to use a shadow root?_

You can prevent Ponys from creating a shadow root on your custom element with the following:
```html
<script>
  export default class extends HTMLElement {

    static disabledFeatures = ['shadow']

    ...

</script>
```

- _...stop the flash of unstyled content (FOUC)?_

The easy way to handle this for all your custom elements at once: add the following CSS to your page...
```css
:not(:defined) {
  display: none;
}
```

- _...reflect properties as attributes, and vice-versa?_

You _could_ use a bunch of getter and setter methods for this...
```html
<script>
  export default class extends HTMLElement {

    // For strings, numbers, etc.
    set color(value) {
      value != null ? this.setAttribute('color', value) : this.removeAttribute('color')
    }
    get color() {
      return this.hasAttribute('color')
    }

    // For booleans
    set hasCutieMark(value) {
      value ? this.setAttribute('has-cutie-mark', '') : this.removeAttribute('has-cutie-mark')
    }
    get hasCutieMark() {
      return this.hasAttribute('has-cutie-mark')
    }

    ...

</script>
```
**...but I wouldn't!** Consider using [data attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) with your element's [`dataset`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset) instead: it's what they're there for.

- _...trigger behavior when an attribute/property is changed?_

Using the data attributes suggested by the example above, you could try something like this:
```html
<script>
  export default class extends HTMLElement {

    static observedAttributes = ['data-color', 'data-has-cutie-mark']

    attributeChangedCallback(name, previousValue, value) {
      switch (name) {
        case 'data-color'          : return this.changeColor(value)
        case 'data-has-cutie-mark' : return this.setCutieMark(value)
      }
    }

    changeColor(value) { ... }

    setCutieMark(value) { ... }

    ...

</script>
```
For more general information and advice on working with web components, you may wish to consult the relevant pages on [web.dev](https://web.dev/web-components/) from Google, or [MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components) from Mozilla; both are excellent resources.

## OK, I'm sold. But... why the ponies?

Why not ponies? Ponies are awesome. 🦄

But to answer your question fully, there are a few actual reasons also:

- The word "ponies" is what I imagined may come out when small children try to say "components"
- The spelling "Ponys" was chosen as a tribute to my German-speaking friends - plus it was free on npm
- And lastly, but most importantly: as a nod to the ideal of the [ponyfill](https://ponyfill.com/)

With this project, my aim was to create a tool that would let me write web components the way I wish _browsers_ would let me write web components; as such, the Ponys API is deliberately close to existing web standards, and constitutes my proposal for the future syntax/behavior of declarative web components.

My wish, therefore, is that Ponys will one day act as the ponyfill for the native API it suggests; I hope you find it convenient and joyful to use in the meantime. 🌈
