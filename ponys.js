/* ponys v0.3.8
 * 2025 jhuddle
 *
 * Declarative creation of browser-native web components.
 */


export default class {

	static define(name, template, options, url = '')
	{
		if (!template.content) {
			let templateElement = document.createElement('template');
			templateElement.innerHTML = template;
			template = templateElement;
		}
		template = template.content;
		url = new URL(url, document.baseURI);

		let script = template.querySelector('script[setup]') || template.querySelector('script');

		let blobURL = URL.createObjectURL(
			new Blob([
				script?.text?.replace(
					/(import|from)\s*("|')(\.{0,2}\/.*?[^\\])\2/g,  // relative imports
					(match, keyword, quote, path) => keyword + quote + new URL(path, url) + quote
				)
			], {type: 'text/javascript'})
		);

		return import(`${blobURL}#${name}`)
			.then(module => {
				script?.remove();
				class Component extends (module.default || HTMLElement) {
					constructor() {
						super();
						let root = this;
						try { root = root.attachShadow({mode: 'open'}); } catch {}
						this.$ = selector => root.querySelector(selector);
						this.$$ = selector => root.querySelectorAll(selector);
						let content = template.cloneNode(true);
						propagateHost(this, content);
						root.append(content);
					}
				}
				customElements.define(name, Component, options);
				return Component;
			})
			.finally(() => URL.revokeObjectURL(blobURL));
	}

	static defineAll(container = document)
	{
		return Promise.allSettled(
			[...container.querySelectorAll('template[name]')].map(template => {
				let options = {};
				for (let {name, value} of template.attributes) {
					options[name] = value;
				}
				return options.src?
					this.import(options.name, options.src, options):
					this.define(options.name, template, options);
			})
		)
		.then(results => results
			.forEach(result => result.reason && console.error(result.reason))
		);
	}

	static import(name, url, options)
	{
		return fetch(url)
			.then(response => response.ok ? response.text() : Promise.reject(URIError(url)))
			.then(text => this.define(name, text, options, url));
	}

}


function propagateHost(host, parentElement)
{
	for (let element of parentElement.children) {
		element.host = host;
		element.$ = host.$;
		element.$$ = host.$$;
		propagateHost(host, element);
	}
}
