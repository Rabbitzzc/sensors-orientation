export const platform = (): string => {
	const userAgent = navigator.userAgent;
	if (userAgent.includes('Windows NT')) {
		return 'windows';
	}
	if (userAgent.includes('Mac OS X')) {
		return 'mac';
	}
	return 'linux';
};

export const consume = (event: Event, preventDefault?: boolean): void => {
	event.stopImmediatePropagation();
	if (preventDefault) {
		event.preventDefault();
	}
};

export interface CustomElement extends HTMLElement {
	createChild<T extends keyof HTMLElementTagNameMap>(
		childTag: T,
		childClassName: string
	): CustomElement;
}

export const createElement = <T extends keyof HTMLElementTagNameMap>(
	tag: T,
	className: string
): CustomElement => {
	const element = document.createElement(tag) as unknown as CustomElement;
	element.className = className;

	element.createChild = function <T extends keyof HTMLElementTagNameMap>(
		childTag: T,
		childClassName: string
	): CustomElement {
		const childElement = createElement(childTag, childClassName);
		element.appendChild(childElement);
		return childElement;
	};

	return element;
};
