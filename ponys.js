/* ponys v0.1.0
 * 2022 Jamie Huddlestone
 *
 * Declarative creation of browser-native web components.
 */


export class Ponys {

	static defineAll(type = 'component', container = document)
	{
		for (let template of container.querySelectorAll('template[type="'+ type +'"]')) {
			this.define(template.getAttribute('name'), template, template.getAttribute('shadow'));
		}
	}

	static define(name, template, shadow)
	{
		if (typeof template === 'string') {
			let templateElement = document.createElement('template');
			templateElement.innerHTML = template;
			template = templateElement;
		}

		const attributeTypes = {};

		class Component extends HTMLElement {

			constructor()
			{
				super();

				const propsCache = {};

				let content = template.content.cloneNode(true);
				if (shadow != null) {
					let root = this.attachShadow({mode: shadow === 'closed' ? 'closed' : 'open'});
					root.appendChild(content);
				}
				else {
					slotElements(content, Array.from(this.childNodes));
					this.appendChild(content);
					new MutationObserver(mutations => {
						for (let mutation of mutations) {
							slotElements(this, mutation.addedNodes);
						}
					}).observe(this, {childList: true});
				}

				new MutationObserver(mutations => {
					for (let mutation of mutations) {
						let prop = mutation.attributeName;
						propsCache[prop] = undefined;
					}
				}).observe(this, {attributes: true, attributeFilter: Object.keys(attributeTypes)});

				for (let [prop, type] of Object.entries(attributeTypes)) {
					Object.defineProperty(this, prop, {
						enumerable: true,
						get() {
							if (propsCache[prop] === undefined) {
								let attributeExists = this.hasAttribute(prop);
								if (type === Boolean) {
									propsCache[prop] = attributeExists;
								}
								else {
									let value = attributeExists ? this.getAttribute(prop) : undefined;
									if (value !== undefined) {
										propsCache[prop] = (
											type === String ? value                                   :
											type === Object ? evaluate(value, this)                   :
											type === Array  ? Array.from(evaluate(value, this) || []) :
											type === Number ? parseFloat(value)                       :
											new type(value)  // Date | Function | etc.
										);
									}
								}
							}
							return propsCache[prop];
						},
						set(value) {
							if (type === Boolean) {
								propsCache[prop] = Boolean(value);
								value ? this.setAttribute(prop, '') : this.removeAttribute(prop);
								propsCache[prop] = Boolean(value);  // restore after MutationObserver
							}
							else {
								propsCache[prop] = value;
								let string = typeof value === 'string' ? value : JSON.stringify(value);
								value != null ? this.setAttribute(prop, string) : this.removeAttribute(prop);
								propsCache[prop] = value;  // restore after MutationObserver
							}
						}
					});
				}
			}

		}

		Component.formAssociated = undefined;
		Component.observedAttributes = undefined;

		if (shadow == null) {
			for (let style of template.content.querySelectorAll('style')) {
				document.head.appendChild(style);
				scopeStyles(name, style.sheet);
			}
		}

		for (let script of template.content.querySelectorAll('script')) {
			let func = new Function('with(this.constructor){'+ script.text +'}');
			let types = func.call(Component.prototype);
			Object.assign(attributeTypes, types);
			script.remove();
		}

		if (Component.observedAttributes === undefined) {
			Component.observedAttributes = Object.keys(attributeTypes);
		}

		customElements.define(name, Component);
	}

}


function evaluate(value, context)
{
	if (typeof value === 'string') {
		return new Function('return('+ (value || undefined) +')').call(context);
	}
	else return value;
}


function scopeStyles(scopeSelector, styleRule)
{
	if (styleRule.selectorText) {
		styleRule.selectorText = (
			styleRule.selectorText
			.split(/,\s*/)
			.map(ruleSelector => scopeSelector +' '+ ruleSelector)
			.join(', ')
		);
	}
	else {
		for (let rule of styleRule.cssRules) {
			scopeStyles(scopeSelector, rule);
		}
	}
}


function slotElements(target, nodes = Array.from(target.childNodes))
{
	let defaultSlot = target.querySelector('slot:not([name])');
	for (let node of nodes) {
		let slotName = node.getAttribute && node.getAttribute('slot');
		if (slotName) {
			let namedSlot = target.querySelector('slot[name="'+ slotName +'"]');
			if (namedSlot) {
				namedSlot.innerHTML = '';
				namedSlot.appendChild(node);
			}
			else node.remove();
		}
		else {
			if (defaultSlot) {
				defaultSlot.appendChild(node);
			}
			else node.remove();
		}
	}
}
