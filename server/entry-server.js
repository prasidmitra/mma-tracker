import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import React5, { Component, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import fastCompare from "react-fast-compare";
import invariant from "invariant";
import shallowEqual from "shallowequal";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Link, Outlet, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
//#region node_modules/react-helmet-async/lib/index.esm.js
var TAG_NAMES = /* @__PURE__ */ ((TAG_NAMES2) => {
	TAG_NAMES2["BASE"] = "base";
	TAG_NAMES2["BODY"] = "body";
	TAG_NAMES2["HEAD"] = "head";
	TAG_NAMES2["HTML"] = "html";
	TAG_NAMES2["LINK"] = "link";
	TAG_NAMES2["META"] = "meta";
	TAG_NAMES2["NOSCRIPT"] = "noscript";
	TAG_NAMES2["SCRIPT"] = "script";
	TAG_NAMES2["STYLE"] = "style";
	TAG_NAMES2["TITLE"] = "title";
	TAG_NAMES2["FRAGMENT"] = "Symbol(react.fragment)";
	return TAG_NAMES2;
})(TAG_NAMES || {});
var SEO_PRIORITY_TAGS = {
	link: { rel: [
		"amphtml",
		"canonical",
		"alternate"
	] },
	script: { type: ["application/ld+json"] },
	meta: {
		charset: "",
		name: [
			"generator",
			"robots",
			"description"
		],
		property: [
			"og:type",
			"og:title",
			"og:url",
			"og:image",
			"og:image:alt",
			"og:description",
			"twitter:url",
			"twitter:title",
			"twitter:description",
			"twitter:image",
			"twitter:image:alt",
			"twitter:card",
			"twitter:site"
		]
	}
};
var VALID_TAG_NAMES = Object.values(TAG_NAMES);
var REACT_TAG_MAP = {
	accesskey: "accessKey",
	charset: "charSet",
	class: "className",
	contenteditable: "contentEditable",
	contextmenu: "contextMenu",
	"http-equiv": "httpEquiv",
	itemprop: "itemProp",
	tabindex: "tabIndex"
};
var HTML_TAG_MAP = Object.entries(REACT_TAG_MAP).reduce((carry, [key, value]) => {
	carry[value] = key;
	return carry;
}, {});
var HELMET_ATTRIBUTE = "data-rh";
var HELMET_PROPS = {
	DEFAULT_TITLE: "defaultTitle",
	DEFER: "defer",
	ENCODE_SPECIAL_CHARACTERS: "encodeSpecialCharacters",
	ON_CHANGE_CLIENT_STATE: "onChangeClientState",
	TITLE_TEMPLATE: "titleTemplate",
	PRIORITIZE_SEO_TAGS: "prioritizeSeoTags"
};
var getInnermostProperty = (propsList, property) => {
	for (let i = propsList.length - 1; i >= 0; i -= 1) {
		const props = propsList[i];
		if (Object.prototype.hasOwnProperty.call(props, property)) return props[property];
	}
	return null;
};
var getTitleFromPropsList = (propsList) => {
	let innermostTitle = getInnermostProperty(propsList, "title");
	const innermostTemplate = getInnermostProperty(propsList, HELMET_PROPS.TITLE_TEMPLATE);
	if (Array.isArray(innermostTitle)) innermostTitle = innermostTitle.join("");
	if (innermostTemplate && innermostTitle) return innermostTemplate.replace(/%s/g, () => innermostTitle);
	const innermostDefaultTitle = getInnermostProperty(propsList, HELMET_PROPS.DEFAULT_TITLE);
	return innermostTitle || innermostDefaultTitle || void 0;
};
var getOnChangeClientState = (propsList) => getInnermostProperty(propsList, HELMET_PROPS.ON_CHANGE_CLIENT_STATE) || (() => {});
var getAttributesFromPropsList = (tagType, propsList) => propsList.filter((props) => typeof props[tagType] !== "undefined").map((props) => props[tagType]).reduce((tagAttrs, current) => ({
	...tagAttrs,
	...current
}), {});
var getBaseTagFromPropsList = (primaryAttributes, propsList) => propsList.filter((props) => typeof props["base"] !== "undefined").map((props) => props["base"]).reverse().reduce((innermostBaseTag, tag) => {
	if (!innermostBaseTag.length) {
		const keys = Object.keys(tag);
		for (let i = 0; i < keys.length; i += 1) {
			const lowerCaseAttributeKey = keys[i].toLowerCase();
			if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && tag[lowerCaseAttributeKey]) return innermostBaseTag.concat(tag);
		}
	}
	return innermostBaseTag;
}, []);
var warn = (msg) => console && typeof console.warn === "function" && console.warn(msg);
var getTagsFromPropsList = (tagName, primaryAttributes, propsList) => {
	const approvedSeenTags = {};
	return propsList.filter((props) => {
		if (Array.isArray(props[tagName])) return true;
		if (typeof props[tagName] !== "undefined") warn(`Helmet: ${tagName} should be of type "Array". Instead found type "${typeof props[tagName]}"`);
		return false;
	}).map((props) => props[tagName]).reverse().reduce((approvedTags, instanceTags) => {
		const instanceSeenTags = {};
		instanceTags.filter((tag) => {
			let primaryAttributeKey;
			const keys2 = Object.keys(tag);
			for (let i = 0; i < keys2.length; i += 1) {
				const attributeKey = keys2[i];
				const lowerCaseAttributeKey = attributeKey.toLowerCase();
				if (primaryAttributes.indexOf(lowerCaseAttributeKey) !== -1 && !(primaryAttributeKey === "rel" && tag[primaryAttributeKey].toLowerCase() === "canonical") && !(lowerCaseAttributeKey === "rel" && tag[lowerCaseAttributeKey].toLowerCase() === "stylesheet")) primaryAttributeKey = lowerCaseAttributeKey;
				if (primaryAttributes.indexOf(attributeKey) !== -1 && (attributeKey === "innerHTML" || attributeKey === "cssText" || attributeKey === "itemprop")) primaryAttributeKey = attributeKey;
			}
			if (!primaryAttributeKey || !tag[primaryAttributeKey]) return false;
			const value = tag[primaryAttributeKey].toLowerCase();
			if (!approvedSeenTags[primaryAttributeKey]) approvedSeenTags[primaryAttributeKey] = {};
			if (!instanceSeenTags[primaryAttributeKey]) instanceSeenTags[primaryAttributeKey] = {};
			if (!approvedSeenTags[primaryAttributeKey][value]) {
				instanceSeenTags[primaryAttributeKey][value] = true;
				return true;
			}
			return false;
		}).reverse().forEach((tag) => approvedTags.push(tag));
		const keys = Object.keys(instanceSeenTags);
		for (let i = 0; i < keys.length; i += 1) {
			const attributeKey = keys[i];
			approvedSeenTags[attributeKey] = {
				...approvedSeenTags[attributeKey],
				...instanceSeenTags[attributeKey]
			};
		}
		return approvedTags;
	}, []).reverse();
};
var getAnyTrueFromPropsList = (propsList, checkedTag) => {
	if (Array.isArray(propsList) && propsList.length) {
		for (let index = 0; index < propsList.length; index += 1) if (propsList[index][checkedTag]) return true;
	}
	return false;
};
var reducePropsToState = (propsList) => ({
	baseTag: getBaseTagFromPropsList(["href"], propsList),
	bodyAttributes: getAttributesFromPropsList("bodyAttributes", propsList),
	defer: getInnermostProperty(propsList, HELMET_PROPS.DEFER),
	encode: getInnermostProperty(propsList, HELMET_PROPS.ENCODE_SPECIAL_CHARACTERS),
	htmlAttributes: getAttributesFromPropsList("htmlAttributes", propsList),
	linkTags: getTagsFromPropsList("link", ["rel", "href"], propsList),
	metaTags: getTagsFromPropsList("meta", [
		"name",
		"charset",
		"http-equiv",
		"property",
		"itemprop"
	], propsList),
	noscriptTags: getTagsFromPropsList("noscript", ["innerHTML"], propsList),
	onChangeClientState: getOnChangeClientState(propsList),
	scriptTags: getTagsFromPropsList("script", ["src", "innerHTML"], propsList),
	styleTags: getTagsFromPropsList("style", ["cssText"], propsList),
	title: getTitleFromPropsList(propsList),
	titleAttributes: getAttributesFromPropsList("titleAttributes", propsList),
	prioritizeSeoTags: getAnyTrueFromPropsList(propsList, HELMET_PROPS.PRIORITIZE_SEO_TAGS)
});
var flattenArray = (possibleArray) => Array.isArray(possibleArray) ? possibleArray.join("") : possibleArray;
var checkIfPropsMatch = (props, toMatch) => {
	const keys = Object.keys(props);
	for (let i = 0; i < keys.length; i += 1) if (toMatch[keys[i]] && toMatch[keys[i]].includes(props[keys[i]])) return true;
	return false;
};
var prioritizer = (elementsList, propsToMatch) => {
	if (Array.isArray(elementsList)) return elementsList.reduce((acc, elementAttrs) => {
		if (checkIfPropsMatch(elementAttrs, propsToMatch)) acc.priority.push(elementAttrs);
		else acc.default.push(elementAttrs);
		return acc;
	}, {
		priority: [],
		default: []
	});
	return {
		default: elementsList,
		priority: []
	};
};
var without = (obj, key) => {
	return {
		...obj,
		[key]: void 0
	};
};
var SELF_CLOSING_TAGS = [
	"noscript",
	"script",
	"style"
];
var encodeSpecialCharacters = (str, encode = true) => {
	if (encode === false) return String(str);
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
};
var generateElementAttributesAsString = (attributes) => Object.keys(attributes).reduce((str, key) => {
	const attr = typeof attributes[key] !== "undefined" ? `${key}="${attributes[key]}"` : `${key}`;
	return str ? `${str} ${attr}` : attr;
}, "");
var generateTitleAsString = (type, title, attributes, encode) => {
	const attributeString = generateElementAttributesAsString(attributes);
	const flattenedTitle = flattenArray(title);
	return attributeString ? `<${type} ${HELMET_ATTRIBUTE}="true" ${attributeString}>${encodeSpecialCharacters(flattenedTitle, encode)}</${type}>` : `<${type} ${HELMET_ATTRIBUTE}="true">${encodeSpecialCharacters(flattenedTitle, encode)}</${type}>`;
};
var generateTagsAsString = (type, tags, encode = true) => tags.reduce((str, t) => {
	const tag = t;
	const attributeHtml = Object.keys(tag).filter((attribute) => !(attribute === "innerHTML" || attribute === "cssText")).reduce((string, attribute) => {
		const attr = typeof tag[attribute] === "undefined" ? attribute : `${attribute}="${encodeSpecialCharacters(tag[attribute], encode)}"`;
		return string ? `${string} ${attr}` : attr;
	}, "");
	const tagContent = tag.innerHTML || tag.cssText || "";
	return `${str}<${type} ${HELMET_ATTRIBUTE}="true" ${attributeHtml}${SELF_CLOSING_TAGS.indexOf(type) === -1 ? `/>` : `>${tagContent}</${type}>`}`;
}, "");
var convertElementAttributesToReactProps = (attributes, initProps = {}) => Object.keys(attributes).reduce((obj, key) => {
	const mapped = REACT_TAG_MAP[key];
	obj[mapped || key] = attributes[key];
	return obj;
}, initProps);
var generateTitleAsReactComponent = (_type, title, attributes) => {
	const props = convertElementAttributesToReactProps(attributes, {
		key: title,
		[HELMET_ATTRIBUTE]: true
	});
	return [React5.createElement("title", props, title)];
};
var generateTagsAsReactComponent = (type, tags) => tags.map((tag, i) => {
	const mappedTag = {
		key: i,
		[HELMET_ATTRIBUTE]: true
	};
	Object.keys(tag).forEach((attribute) => {
		const mappedAttribute = REACT_TAG_MAP[attribute] || attribute;
		if (mappedAttribute === "innerHTML" || mappedAttribute === "cssText") mappedTag.dangerouslySetInnerHTML = { __html: tag.innerHTML || tag.cssText };
		else mappedTag[mappedAttribute] = tag[attribute];
	});
	return React5.createElement(type, mappedTag);
});
var getMethodsForTag = (type, tags, encode = true) => {
	switch (type) {
		case "title": return {
			toComponent: () => generateTitleAsReactComponent(type, tags.title, tags.titleAttributes),
			toString: () => generateTitleAsString(type, tags.title, tags.titleAttributes, encode)
		};
		case "bodyAttributes":
		case "htmlAttributes": return {
			toComponent: () => convertElementAttributesToReactProps(tags),
			toString: () => generateElementAttributesAsString(tags)
		};
		default: return {
			toComponent: () => generateTagsAsReactComponent(type, tags),
			toString: () => generateTagsAsString(type, tags, encode)
		};
	}
};
var getPriorityMethods = ({ metaTags, linkTags, scriptTags, encode }) => {
	const meta = prioritizer(metaTags, SEO_PRIORITY_TAGS.meta);
	const link = prioritizer(linkTags, SEO_PRIORITY_TAGS.link);
	const script = prioritizer(scriptTags, SEO_PRIORITY_TAGS.script);
	return {
		priorityMethods: {
			toComponent: () => [
				...generateTagsAsReactComponent("meta", meta.priority),
				...generateTagsAsReactComponent("link", link.priority),
				...generateTagsAsReactComponent("script", script.priority)
			],
			toString: () => `${getMethodsForTag("meta", meta.priority, encode)} ${getMethodsForTag("link", link.priority, encode)} ${getMethodsForTag("script", script.priority, encode)}`
		},
		metaTags: meta.default,
		linkTags: link.default,
		scriptTags: script.default
	};
};
var mapStateOnServer = (props) => {
	const { baseTag, bodyAttributes, encode = true, htmlAttributes, noscriptTags, styleTags, title = "", titleAttributes, prioritizeSeoTags } = props;
	let { linkTags, metaTags, scriptTags } = props;
	let priorityMethods = {
		toComponent: () => [],
		toString: () => ""
	};
	if (prioritizeSeoTags) ({priorityMethods, linkTags, metaTags, scriptTags} = getPriorityMethods(props));
	return {
		priority: priorityMethods,
		base: getMethodsForTag("base", baseTag, encode),
		bodyAttributes: getMethodsForTag("bodyAttributes", bodyAttributes, encode),
		htmlAttributes: getMethodsForTag("htmlAttributes", htmlAttributes, encode),
		link: getMethodsForTag("link", linkTags, encode),
		meta: getMethodsForTag("meta", metaTags, encode),
		noscript: getMethodsForTag("noscript", noscriptTags, encode),
		script: getMethodsForTag("script", scriptTags, encode),
		style: getMethodsForTag("style", styleTags, encode),
		title: getMethodsForTag("title", {
			title,
			titleAttributes
		}, encode)
	};
};
var server_default = mapStateOnServer;
var instances = [];
var isDocument = !!(typeof window !== "undefined" && window.document && window.document.createElement);
var HelmetData = class {
	instances = [];
	canUseDOM = isDocument;
	context;
	value = {
		setHelmet: (serverState) => {
			this.context.helmet = serverState;
		},
		helmetInstances: {
			get: () => this.canUseDOM ? instances : this.instances,
			add: (instance) => {
				(this.canUseDOM ? instances : this.instances).push(instance);
			},
			remove: (instance) => {
				const index = (this.canUseDOM ? instances : this.instances).indexOf(instance);
				(this.canUseDOM ? instances : this.instances).splice(index, 1);
			}
		}
	};
	constructor(context, canUseDOM) {
		this.context = context;
		this.canUseDOM = canUseDOM || false;
		if (!canUseDOM) context.helmet = server_default({
			baseTag: [],
			bodyAttributes: {},
			encodeSpecialCharacters: true,
			htmlAttributes: {},
			linkTags: [],
			metaTags: [],
			noscriptTags: [],
			scriptTags: [],
			styleTags: [],
			title: "",
			titleAttributes: {}
		});
	}
};
var isReact19 = parseInt(React5.version.split(".")[0], 10) >= 19;
var Context = React5.createContext({});
var HelmetProvider = class _HelmetProvider extends Component {
	static canUseDOM = isDocument;
	helmetData;
	constructor(props) {
		super(props);
		if (isReact19) this.helmetData = null;
		else this.helmetData = new HelmetData(this.props.context || {}, _HelmetProvider.canUseDOM);
	}
	render() {
		if (isReact19) return /* @__PURE__ */ React5.createElement(React5.Fragment, null, this.props.children);
		return /* @__PURE__ */ React5.createElement(Context.Provider, { value: this.helmetData.value }, this.props.children);
	}
};
var updateTags = (type, tags) => {
	const headElement = document.head || document.querySelector("head");
	const tagNodes = headElement.querySelectorAll(`${type}[${HELMET_ATTRIBUTE}]`);
	const oldTags = [].slice.call(tagNodes);
	const newTags = [];
	let indexToDelete;
	if (tags && tags.length) tags.forEach((tag) => {
		const newElement = document.createElement(type);
		for (const attribute in tag) if (Object.prototype.hasOwnProperty.call(tag, attribute)) if (attribute === "innerHTML") newElement.innerHTML = tag.innerHTML;
		else if (attribute === "cssText") {
			const cssText = tag.cssText;
			newElement.appendChild(document.createTextNode(cssText));
		} else {
			const attr = attribute;
			const value = typeof tag[attr] === "undefined" ? "" : tag[attr];
			newElement.setAttribute(attribute, value);
		}
		newElement.setAttribute(HELMET_ATTRIBUTE, "true");
		if (oldTags.some((existingTag, index) => {
			indexToDelete = index;
			return newElement.isEqualNode(existingTag);
		})) oldTags.splice(indexToDelete, 1);
		else newTags.push(newElement);
	});
	oldTags.forEach((tag) => tag.parentNode?.removeChild(tag));
	newTags.forEach((tag) => headElement.appendChild(tag));
	return {
		oldTags,
		newTags
	};
};
var updateAttributes = (tagName, attributes) => {
	const elementTag = document.getElementsByTagName(tagName)[0];
	if (!elementTag) return;
	const helmetAttributeString = elementTag.getAttribute(HELMET_ATTRIBUTE);
	const helmetAttributes = helmetAttributeString ? helmetAttributeString.split(",") : [];
	const attributesToRemove = [...helmetAttributes];
	const attributeKeys = Object.keys(attributes);
	for (const attribute of attributeKeys) {
		const value = attributes[attribute] || "";
		if (elementTag.getAttribute(attribute) !== value) elementTag.setAttribute(attribute, value);
		if (helmetAttributes.indexOf(attribute) === -1) helmetAttributes.push(attribute);
		const indexToSave = attributesToRemove.indexOf(attribute);
		if (indexToSave !== -1) attributesToRemove.splice(indexToSave, 1);
	}
	for (let i = attributesToRemove.length - 1; i >= 0; i -= 1) elementTag.removeAttribute(attributesToRemove[i]);
	if (helmetAttributes.length === attributesToRemove.length) elementTag.removeAttribute(HELMET_ATTRIBUTE);
	else if (elementTag.getAttribute(HELMET_ATTRIBUTE) !== attributeKeys.join(",")) elementTag.setAttribute(HELMET_ATTRIBUTE, attributeKeys.join(","));
};
var updateTitle = (title, attributes) => {
	if (typeof title !== "undefined" && document.title !== title) document.title = flattenArray(title);
	updateAttributes("title", attributes);
};
var commitTagChanges = (newState, cb) => {
	const { baseTag, bodyAttributes, htmlAttributes, linkTags, metaTags, noscriptTags, onChangeClientState, scriptTags, styleTags, title, titleAttributes } = newState;
	updateAttributes("body", bodyAttributes);
	updateAttributes("html", htmlAttributes);
	updateTitle(title, titleAttributes);
	const tagUpdates = {
		baseTag: updateTags("base", baseTag),
		linkTags: updateTags("link", linkTags),
		metaTags: updateTags("meta", metaTags),
		noscriptTags: updateTags("noscript", noscriptTags),
		scriptTags: updateTags("script", scriptTags),
		styleTags: updateTags("style", styleTags)
	};
	const addedTags = {};
	const removedTags = {};
	Object.keys(tagUpdates).forEach((tagType) => {
		const { newTags, oldTags } = tagUpdates[tagType];
		if (newTags.length) addedTags[tagType] = newTags;
		if (oldTags.length) removedTags[tagType] = tagUpdates[tagType].oldTags;
	});
	if (cb) cb();
	onChangeClientState(newState, addedTags, removedTags);
};
var _helmetCallback = null;
var handleStateChangeOnClient = (newState) => {
	if (_helmetCallback) cancelAnimationFrame(_helmetCallback);
	if (newState.defer) _helmetCallback = requestAnimationFrame(() => {
		commitTagChanges(newState, () => {
			_helmetCallback = null;
		});
	});
	else {
		commitTagChanges(newState);
		_helmetCallback = null;
	}
};
var client_default = handleStateChangeOnClient;
var HelmetDispatcher = class extends Component {
	rendered = false;
	shouldComponentUpdate(nextProps) {
		return !shallowEqual(nextProps, this.props);
	}
	componentDidUpdate() {
		this.emitChange();
	}
	componentWillUnmount() {
		const { helmetInstances } = this.props.context;
		helmetInstances.remove(this);
		this.emitChange();
	}
	emitChange() {
		const { helmetInstances, setHelmet } = this.props.context;
		let serverState = null;
		const state = reducePropsToState(helmetInstances.get().map((instance) => {
			const { context: _context, ...props } = instance.props;
			return props;
		}));
		if (HelmetProvider.canUseDOM) client_default(state);
		else if (server_default) serverState = server_default(state);
		setHelmet(serverState);
	}
	init() {
		if (this.rendered) return;
		this.rendered = true;
		const { helmetInstances } = this.props.context;
		helmetInstances.add(this);
		this.emitChange();
	}
	render() {
		this.init();
		return null;
	}
};
var react19Instances = [];
var toHtmlAttributes = (props) => {
	const result = {};
	for (const key of Object.keys(props)) result[HTML_TAG_MAP[key] || key] = props[key];
	return result;
};
var toReactProps = (attrs) => {
	const result = {};
	for (const key of Object.keys(attrs)) {
		const mapped = REACT_TAG_MAP[key];
		result[mapped || key] = attrs[key];
	}
	return result;
};
var applyAttributes = (tagName, attributes) => {
	if (!isDocument) return;
	const el = document.getElementsByTagName(tagName)[0];
	if (!el) return;
	const managedAttr = "data-rh-managed";
	const prev = el.getAttribute(managedAttr);
	const prevKeys = prev ? prev.split(",") : [];
	const nextKeys = Object.keys(attributes);
	for (const key of prevKeys) if (!nextKeys.includes(key)) el.removeAttribute(key);
	for (const key of nextKeys) {
		const value = attributes[key];
		if (value === void 0 || value === null || value === false) el.removeAttribute(key);
		else if (value === true) el.setAttribute(key, "");
		else el.setAttribute(key, String(value));
	}
	if (nextKeys.length > 0) el.setAttribute(managedAttr, nextKeys.join(","));
	else el.removeAttribute(managedAttr);
};
var syncAllAttributes = () => {
	const htmlAttrs = {};
	const bodyAttrs = {};
	for (const instance of react19Instances) {
		const { htmlAttributes, bodyAttributes } = instance.props;
		if (htmlAttributes) Object.assign(htmlAttrs, toHtmlAttributes(htmlAttributes));
		if (bodyAttributes) Object.assign(bodyAttrs, toHtmlAttributes(bodyAttributes));
	}
	applyAttributes("html", htmlAttrs);
	applyAttributes("body", bodyAttrs);
};
var React19Dispatcher = class extends Component {
	componentDidMount() {
		react19Instances.push(this);
		syncAllAttributes();
	}
	componentDidUpdate() {
		syncAllAttributes();
	}
	componentWillUnmount() {
		const index = react19Instances.indexOf(this);
		if (index !== -1) react19Instances.splice(index, 1);
		syncAllAttributes();
	}
	resolveTitle() {
		const { title, titleTemplate, defaultTitle } = this.props;
		if (title && titleTemplate) return titleTemplate.replace(/%s/g, () => Array.isArray(title) ? title.join("") : title);
		return title || defaultTitle || void 0;
	}
	renderTitle() {
		const title = this.resolveTitle();
		if (title === void 0) return null;
		const titleAttributes = this.props.titleAttributes || {};
		return React5.createElement("title", toReactProps(titleAttributes), title);
	}
	renderBase() {
		const { base } = this.props;
		if (!base) return null;
		return React5.createElement("base", toReactProps(base));
	}
	renderMeta() {
		const { meta } = this.props;
		if (!meta || !Array.isArray(meta)) return null;
		return meta.map((attrs, i) => React5.createElement("meta", {
			key: i,
			...toReactProps(attrs)
		}));
	}
	renderLink() {
		const { link } = this.props;
		if (!link || !Array.isArray(link)) return null;
		return link.map((attrs, i) => React5.createElement("link", {
			key: i,
			...toReactProps(attrs)
		}));
	}
	renderScript() {
		const { script } = this.props;
		if (!script || !Array.isArray(script)) return null;
		return script.map((attrs, i) => {
			const { innerHTML, ...rest } = attrs;
			const props = toReactProps(rest);
			if (innerHTML) props.dangerouslySetInnerHTML = { __html: innerHTML };
			return React5.createElement("script", {
				key: i,
				...props
			});
		});
	}
	renderStyle() {
		const { style } = this.props;
		if (!style || !Array.isArray(style)) return null;
		return style.map((attrs, i) => {
			const { cssText, ...rest } = attrs;
			const props = toReactProps(rest);
			if (cssText) props.dangerouslySetInnerHTML = { __html: cssText };
			return React5.createElement("style", {
				key: i,
				...props
			});
		});
	}
	renderNoscript() {
		const { noscript } = this.props;
		if (!noscript || !Array.isArray(noscript)) return null;
		return noscript.map((attrs, i) => {
			const { innerHTML, ...rest } = attrs;
			const props = toReactProps(rest);
			if (innerHTML) props.dangerouslySetInnerHTML = { __html: innerHTML };
			return React5.createElement("noscript", {
				key: i,
				...props
			});
		});
	}
	render() {
		return React5.createElement(React5.Fragment, null, this.renderTitle(), this.renderBase(), this.renderMeta(), this.renderLink(), this.renderScript(), this.renderStyle(), this.renderNoscript());
	}
};
var Helmet = class extends Component {
	static defaultProps = {
		defer: true,
		encodeSpecialCharacters: true,
		prioritizeSeoTags: false
	};
	shouldComponentUpdate(nextProps) {
		return !fastCompare(without(this.props, "helmetData"), without(nextProps, "helmetData"));
	}
	mapNestedChildrenToProps(child, nestedChildren) {
		if (!nestedChildren) return null;
		switch (child.type) {
			case "script":
			case "noscript": return { innerHTML: nestedChildren };
			case "style": return { cssText: nestedChildren };
			default: throw new Error(`<${child.type} /> elements are self-closing and can not contain children. Refer to our API for more information.`);
		}
	}
	flattenArrayTypeChildren(child, arrayTypeChildren, newChildProps, nestedChildren) {
		return {
			...arrayTypeChildren,
			[child.type]: [...arrayTypeChildren[child.type] || [], {
				...newChildProps,
				...this.mapNestedChildrenToProps(child, nestedChildren)
			}]
		};
	}
	mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren) {
		switch (child.type) {
			case "title": return {
				...newProps,
				[child.type]: nestedChildren,
				titleAttributes: { ...newChildProps }
			};
			case "body": return {
				...newProps,
				bodyAttributes: { ...newChildProps }
			};
			case "html": return {
				...newProps,
				htmlAttributes: { ...newChildProps }
			};
			default: return {
				...newProps,
				[child.type]: { ...newChildProps }
			};
		}
	}
	mapArrayTypeChildrenToProps(arrayTypeChildren, newProps) {
		let newFlattenedProps = { ...newProps };
		Object.keys(arrayTypeChildren).forEach((arrayChildName) => {
			newFlattenedProps = {
				...newFlattenedProps,
				[arrayChildName]: arrayTypeChildren[arrayChildName]
			};
		});
		return newFlattenedProps;
	}
	warnOnInvalidChildren(child, nestedChildren) {
		invariant(VALID_TAG_NAMES.some((name) => child.type === name), typeof child.type === "function" ? `You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.` : `Only elements types ${VALID_TAG_NAMES.join(", ")} are allowed. Helmet does not support rendering <${child.type}> elements. Refer to our API for more information.`);
		invariant(!nestedChildren || typeof nestedChildren === "string" || Array.isArray(nestedChildren) && !nestedChildren.some((nestedChild) => typeof nestedChild !== "string"), `Helmet expects a string as a child of <${child.type}>. Did you forget to wrap your children in braces? ( <${child.type}>{\`\`}</${child.type}> ) Refer to our API for more information.`);
		return true;
	}
	mapChildrenToProps(children, newProps) {
		let arrayTypeChildren = {};
		React5.Children.forEach(children, (child) => {
			if (!child || !child.props) return;
			const { children: nestedChildren, ...childProps } = child.props;
			const newChildProps = Object.keys(childProps).reduce((obj, key) => {
				obj[HTML_TAG_MAP[key] || key] = childProps[key];
				return obj;
			}, {});
			let { type } = child;
			if (typeof type === "symbol") type = type.toString();
			else this.warnOnInvalidChildren(child, nestedChildren);
			switch (type) {
				case "Symbol(react.fragment)":
					newProps = this.mapChildrenToProps(nestedChildren, newProps);
					break;
				case "link":
				case "meta":
				case "noscript":
				case "script":
				case "style":
					arrayTypeChildren = this.flattenArrayTypeChildren(child, arrayTypeChildren, newChildProps, nestedChildren);
					break;
				default:
					newProps = this.mapObjectTypeChildren(child, newProps, newChildProps, nestedChildren);
					break;
			}
		});
		return this.mapArrayTypeChildrenToProps(arrayTypeChildren, newProps);
	}
	render() {
		const { children, ...props } = this.props;
		let newProps = { ...props };
		let { helmetData } = props;
		if (children) newProps = this.mapChildrenToProps(children, newProps);
		if (helmetData && !(helmetData instanceof HelmetData)) {
			helmetData = new HelmetData(helmetData.context, true);
			delete newProps.helmetData;
		}
		if (isReact19) return /* @__PURE__ */ React5.createElement(React19Dispatcher, { ...newProps });
		return helmetData ? /* @__PURE__ */ React5.createElement(HelmetDispatcher, {
			...newProps,
			context: helmetData.value
		}) : /* @__PURE__ */ React5.createElement(Context.Consumer, null, (context) => /* @__PURE__ */ React5.createElement(HelmetDispatcher, {
			...newProps,
			context
		}));
	}
};
//#endregion
//#region src/context/DataContext.tsx
var CREATORS = [
	"mma_guru",
	"mma_joey",
	"sneaky_mma",
	"brendan_schaub",
	"luke_thomas",
	"the_weasel",
	"bedtime_mma",
	"lucas_tracy_mma"
];
var DataContext = createContext({
	events: [],
	predictions: [],
	flagged: [],
	loading: true,
	error: null
});
async function fetchJson(url, fallback) {
	try {
		const res = await fetch(url);
		if (!res.ok) {
			console.warn(`[DataContext] ${url} returned ${res.status}`);
			return fallback;
		}
		return await res.json();
	} catch (e) {
		console.error(`[DataContext] fetch error for ${url}:`, e);
		return fallback;
	}
}
function DataProvider({ children }) {
	const [state, setState] = useState({
		events: [],
		predictions: [],
		flagged: [],
		loading: true,
		error: null
	});
	useEffect(() => {
		const base = "/";
		const eventsPromise = fetchJson(`${base}data/events.json`, []);
		const flaggedPromise = fetchJson(`${base}data/flagged.json`, []);
		const creatorPromises = CREATORS.map((c) => fetchJson(`${base}data/predictions/${c}.json`, []));
		Promise.all([
			eventsPromise,
			flaggedPromise,
			...creatorPromises
		]).then((results) => {
			const events = results[0];
			const flagged = results[1];
			const predictions = results.slice(2).flat();
			console.log(`[DataContext] loaded: ${events.length} events, ${predictions.length} predictions`);
			setState({
				events,
				predictions,
				flagged,
				loading: false,
				error: null
			});
		}).catch((err) => {
			console.error("[DataContext] Promise.all error:", err);
			setState((s) => ({
				...s,
				loading: false,
				error: err.message
			}));
		});
	}, []);
	return /* @__PURE__ */ jsx(DataContext.Provider, {
		value: state,
		children
	});
}
function useData() {
	return useContext(DataContext);
}
//#endregion
//#region src/context/ThemeContext.tsx
var ThemeContext = createContext({
	theme: "dark",
	toggleTheme: () => {}
});
function ThemeProvider({ children }) {
	useEffect(() => {
		document.documentElement.setAttribute("data-theme", "dark");
		localStorage.removeItem("theme");
	}, []);
	return /* @__PURE__ */ jsx(ThemeContext.Provider, {
		value: {
			theme: "dark",
			toggleTheme: () => {}
		},
		children
	});
}
//#endregion
//#region src/hooks/useData.ts
function eligiblePredictions(predictions) {
	return predictions.filter((p) => p.correct !== null && p.predicted_winner !== null && p.fight_skipped !== true && (p.ambiguous !== true || p.manually_resolved === true));
}
function calcAccuracy(predictions) {
	const eligible = eligiblePredictions(predictions);
	if (eligible.length === 0) return 0;
	return eligible.filter((p) => p.correct === true).length / eligible.length;
}
//#endregion
//#region src/utils/accuracy.ts
function getAccuracyColor(acc) {
	if (acc >= .65) return "var(--success)";
	if (acc >= .55) return "var(--gold-primary)";
	return "var(--danger)";
}
function formatPct(n) {
	return (n * 100).toFixed(1) + "%";
}
function applyFilters(predictions, events, filters) {
	return predictions.filter((p) => {
		const event = events.find((e) => e.event_id === p.event_id);
		if (!event) return false;
		if (filters.year !== "all") {
			if (new Date(event.date).getFullYear() !== filters.year) return false;
		}
		if (filters.eventType !== "all") {
			if ((event.event_type || "fight_night") !== filters.eventType) return false;
		}
		if (filters.cardPosition !== "all") {
			const fight = event.fights.find((f) => f.fight_id === p.fight_id);
			if (!fight) return false;
			if (filters.cardPosition === "main_event" && fight.card_position !== "main_event") return false;
			if (filters.cardPosition === "main_card" && ![
				"main_event",
				"co_main",
				"main_card"
			].includes(fight.card_position)) return false;
		}
		return true;
	});
}
var CREATOR_DISPLAY = {
	mma_guru: "MMA Guru",
	mma_joey: "MMA Joey",
	sneaky_mma: "Sneaky MMA",
	brendan_schaub: "Brendan Schaub",
	luke_thomas: "Luke Thomas",
	the_weasel: "The Weasel",
	bedtime_mma: "Bedtime MMA",
	lucas_tracy_mma: "Lucas Tracy MMA"
};
var ALL_CREATORS = Object.keys(CREATOR_DISPLAY);
function getCreatorStats(slug, allPredictions, events, filters) {
	const preds = applyFilters(allPredictions.filter((p) => p.creator === slug), events, filters);
	const elig = eligiblePredictions(preds);
	const correct = elig.filter((p) => p.correct).length;
	const incorrect = elig.filter((p) => p.correct === false).length;
	const accuracy = calcAccuracy(preds);
	const mainEventPreds = elig.filter((p) => {
		const ev = events.find((e) => e.event_id === p.event_id);
		if (!ev) return false;
		return ev.fights.find((f) => f.fight_id === p.fight_id)?.card_position === "main_event";
	});
	const ppvPreds = elig.filter((p) => {
		return events.find((e) => e.event_id === p.event_id)?.event_type === "ppv";
	});
	return {
		slug,
		displayName: CREATOR_DISPLAY[slug] || slug,
		accuracy,
		correct,
		incorrect,
		eligible: elig.length,
		mainEventAccuracy: mainEventPreds.length >= 5 ? mainEventPreds.filter((p) => p.correct).length / mainEventPreds.length : null,
		ppvAccuracy: ppvPreds.length >= 5 ? ppvPreds.filter((p) => p.correct).length / ppvPreds.length : null
	};
}
//#endregion
//#region src/hooks/useIsMobile.ts
function useIsMobile(breakpoint = 768) {
	const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
	useEffect(() => {
		const handler = () => setIsMobile(window.innerWidth < breakpoint);
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
	}, [breakpoint]);
	return isMobile;
}
//#endregion
//#region src/assets/logo.png
var logo_default = "/assets/logo-BzfFgSVn.png";
//#endregion
//#region src/components/Navbar.tsx
var LOGO_HEIGHT = 48;
var navLinkStyle = {
	color: "var(--text-secondary)",
	fontSize: "1rem",
	fontWeight: 600,
	textDecoration: "none"
};
function Navbar() {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [hamburgerOpen, setHamburgerOpen] = useState(false);
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const { predictions } = useData();
	const sortedCreators = useMemo(() => ALL_CREATORS.filter((slug) => predictions.some((p) => p.creator === slug)).sort((a, b) => CREATOR_DISPLAY[a].localeCompare(CREATOR_DISPLAY[b])), [predictions]);
	const closeHamburger = () => setHamburgerOpen(false);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("nav", {
		style: {
			background: "var(--bg-card)",
			borderBottom: "1px solid var(--border)",
			padding: "0 1.25rem",
			height: "72px",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			position: "sticky",
			top: 0,
			zIndex: 100
		},
		children: [/* @__PURE__ */ jsx(Link, {
			to: "/",
			style: {
				textDecoration: "none",
				flexShrink: 0
			},
			onClick: closeHamburger,
			children: /* @__PURE__ */ jsx("img", {
				src: logo_default,
				alt: "OctaScore",
				style: {
					height: isMobile ? "36px" : `${LOGO_HEIGHT}px`,
					width: "auto",
					display: "block"
				}
			})
		}), isMobile ? /* @__PURE__ */ jsx("button", {
			onClick: () => setHamburgerOpen((o) => !o),
			style: {
				background: "none",
				border: "none",
				color: "var(--text)",
				fontSize: "1.5rem",
				cursor: "pointer",
				padding: "4px 8px",
				lineHeight: 1,
				fontFamily: "inherit"
			},
			"aria-label": "Menu",
			children: hamburgerOpen ? "✕" : "☰"
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
			style: {
				position: "absolute",
				left: "50%",
				transform: "translateX(-50%)",
				display: "flex",
				alignItems: "center",
				gap: "1.5rem"
			},
			children: [
				/* @__PURE__ */ jsx(Link, {
					to: "/",
					style: navLinkStyle,
					onMouseEnter: (e) => e.currentTarget.style.color = "var(--text-primary)",
					onMouseLeave: (e) => e.currentTarget.style.color = "var(--text-secondary)",
					children: "Leaderboard"
				}),
				/* @__PURE__ */ jsxs("div", {
					style: { position: "relative" },
					onMouseEnter: () => setDropdownOpen(true),
					onMouseLeave: () => setDropdownOpen(false),
					children: [/* @__PURE__ */ jsxs("button", {
						style: {
							background: "none",
							border: "none",
							color: "var(--text-secondary)",
							fontSize: "1rem",
							fontWeight: 600,
							cursor: "pointer",
							fontFamily: "inherit",
							display: "flex",
							alignItems: "center",
							gap: "4px",
							padding: "4px 0"
						},
						children: ["Creators ", /* @__PURE__ */ jsx("span", {
							style: { fontSize: "0.85rem" },
							children: "▾"
						})]
					}), dropdownOpen && /* @__PURE__ */ jsx("div", {
						style: {
							position: "absolute",
							top: "100%",
							left: 0,
							background: "var(--bg-card)",
							border: "1px solid var(--border)",
							borderRadius: "8px",
							padding: "0.375rem 0",
							minWidth: "180px",
							boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
							zIndex: 200
						},
						children: sortedCreators.map((slug) => /* @__PURE__ */ jsx("button", {
							onClick: () => {
								navigate(`/creator/${slug}`);
								setDropdownOpen(false);
							},
							style: {
								display: "block",
								width: "100%",
								textAlign: "left",
								padding: "0.5rem 1rem",
								background: "none",
								border: "none",
								color: "var(--text-primary)",
								fontSize: "1rem",
								fontWeight: 500,
								cursor: "pointer",
								fontFamily: "inherit"
							},
							onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)",
							onMouseLeave: (e) => e.currentTarget.style.background = "none",
							children: CREATOR_DISPLAY[slug]
						}, slug))
					})]
				}),
				/* @__PURE__ */ jsx(Link, {
					to: "/about",
					style: navLinkStyle,
					onMouseEnter: (e) => e.currentTarget.style.color = "var(--text-primary)",
					onMouseLeave: (e) => e.currentTarget.style.color = "var(--text-secondary)",
					children: "About"
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: "1rem"
			},
			children: /* @__PURE__ */ jsx("a", {
				href: "https://github.com/prasidmitra/mma-tracker",
				target: "_blank",
				rel: "noreferrer",
				style: {
					color: "var(--text-secondary)",
					fontSize: "0.8rem",
					fontWeight: 500
				},
				children: "GitHub"
			})
		})] })]
	}), isMobile && hamburgerOpen && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			position: "fixed",
			inset: 0,
			zIndex: 98,
			background: "rgba(0,0,0,0.5)"
		},
		onClick: closeHamburger
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			position: "fixed",
			top: "72px",
			left: 0,
			right: 0,
			background: "var(--panel)",
			borderBottom: "1px solid var(--border)",
			zIndex: 99,
			maxHeight: "calc(100vh - 72px)",
			overflowY: "auto"
		},
		children: [
			[{
				label: "Leaderboard",
				to: "/"
			}, {
				label: "About",
				to: "/about"
			}].map(({ label, to }) => /* @__PURE__ */ jsx(Link, {
				to,
				onClick: closeHamburger,
				style: {
					display: "block",
					padding: "0.875rem 1.25rem",
					color: "var(--text)",
					fontSize: "1rem",
					fontWeight: 600,
					textDecoration: "none",
					borderBottom: "1px solid var(--border)"
				},
				children: label
			}, to)),
			/* @__PURE__ */ jsx("div", {
				style: {
					padding: "0.5rem 1.25rem 0.25rem",
					fontSize: "0.65rem",
					fontWeight: 700,
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					color: "var(--muted)",
					borderBottom: "1px solid var(--border)"
				},
				children: "Creators"
			}),
			sortedCreators.map((slug) => /* @__PURE__ */ jsx("button", {
				onClick: () => {
					navigate(`/creator/${slug}`);
					closeHamburger();
				},
				style: {
					display: "block",
					width: "100%",
					textAlign: "left",
					padding: "0.75rem 1.25rem 0.75rem 1.75rem",
					background: "none",
					border: "none",
					borderBottom: "1px solid var(--border)",
					color: "var(--text)",
					fontSize: "0.95rem",
					fontWeight: 500,
					cursor: "pointer",
					fontFamily: "inherit"
				},
				onMouseEnter: (e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)",
				onMouseLeave: (e) => e.currentTarget.style.background = "none",
				children: CREATOR_DISPLAY[slug]
			}, slug))
		]
	})] })] });
}
//#endregion
//#region src/hooks/useFilters.ts
function useFilters() {
	const [searchParams, setSearchParams] = useSearchParams();
	return [{
		year: searchParams.get("year") === "all" || !searchParams.get("year") ? "all" : Number(searchParams.get("year")),
		eventType: searchParams.get("eventType") || "all",
		cardPosition: searchParams.get("cardPosition") || "all"
	}, useCallback((updates) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			Object.entries(updates).forEach(([k, v]) => {
				if (v === "all" || v === void 0) next.delete(k);
				else next.set(k, String(v));
			});
			return next;
		}, { replace: true });
	}, [setSearchParams])];
}
//#endregion
//#region src/components/Sidebar.tsx
function FilterLabel({ children }) {
	return /* @__PURE__ */ jsx("div", {
		style: {
			fontSize: "0.65rem",
			fontWeight: 700,
			textTransform: "uppercase",
			letterSpacing: "0.08em",
			color: "var(--text-secondary)",
			marginBottom: "0.375rem",
			marginTop: "1rem"
		},
		children
	});
}
function FilterOption({ active, dim, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		onClick,
		style: {
			display: "block",
			width: "100%",
			textAlign: "left",
			padding: "5px 8px",
			borderRadius: "5px",
			border: "none",
			background: active ? "var(--accent-purple)" : "transparent",
			color: active ? "#fff" : dim ? "var(--muted)" : "var(--text-primary)",
			fontSize: "0.82rem",
			fontWeight: active ? 600 : 400,
			opacity: dim && !active ? .45 : 1,
			cursor: dim ? "default" : "pointer",
			fontFamily: "inherit",
			transition: "all 0.12s ease",
			marginBottom: "2px"
		},
		onMouseEnter: (e) => {
			if (!active && !dim) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
		},
		onMouseLeave: (e) => {
			if (!active) e.currentTarget.style.background = "transparent";
		},
		children
	});
}
function Sidebar({ events, asDrawer = false }) {
	const [filters, setFilters] = useFilters();
	const { predictions } = useData();
	const years = useMemo(() => {
		const ys = new Set(events.map((e) => new Date(e.date).getFullYear()));
		return Array.from(ys).sort((a, b) => b - a);
	}, [events]);
	const yearsWithData = useMemo(() => {
		const eventYearMap = new Map(events.map((e) => [e.event_id, new Date(e.date).getFullYear()]));
		const ys = /* @__PURE__ */ new Set();
		predictions.forEach((p) => {
			const y = eventYearMap.get(p.event_id);
			if (y) ys.add(y);
		});
		return ys;
	}, [events, predictions]);
	return /* @__PURE__ */ jsx("aside", {
		style: asDrawer ? {
			padding: "0.75rem 1rem 0.5rem",
			background: "none"
		} : {
			width: "200px",
			minWidth: "200px",
			padding: "1rem 0.875rem",
			borderRight: "1px solid var(--border)",
			position: "sticky",
			top: "72px",
			height: "calc(100vh - 72px)",
			overflowY: "auto",
			background: "var(--bg-card)"
		},
		children: asDrawer ? /* @__PURE__ */ jsxs("div", {
			style: {
				display: "grid",
				gridTemplateColumns: "1fr 1fr 1fr",
				gap: "0 0.5rem"
			},
			children: [
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsx(FilterLabel, { children: "Year" }),
					/* @__PURE__ */ jsx(FilterOption, {
						active: filters.year === "all",
						onClick: () => setFilters({ year: "all" }),
						children: "All Time"
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "2px"
						},
						children: years.map((y) => /* @__PURE__ */ jsx(FilterOption, {
							active: filters.year === y,
							dim: !yearsWithData.has(y),
							onClick: () => setFilters({ year: y }),
							children: y
						}, y))
					})
				] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(FilterLabel, { children: "Event Type" }), [
					["all", "All"],
					["ppv", "PPV"],
					["fight_night", "Fight Nights"]
				].map(([val, label]) => /* @__PURE__ */ jsx(FilterOption, {
					active: filters.eventType === val,
					onClick: () => setFilters({ eventType: val }),
					children: label
				}, val))] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(FilterLabel, { children: "Card" }), [
					["all", "All Fights"],
					["main_card", "Main Card"],
					["main_event", "Main Event"]
				].map(([val, label]) => /* @__PURE__ */ jsx(FilterOption, {
					active: filters.cardPosition === val,
					onClick: () => setFilters({ cardPosition: val }),
					children: label
				}, val))] })
			]
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: "0.75rem",
					fontWeight: 700,
					color: "var(--text-secondary)",
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					marginBottom: "0.5rem"
				},
				children: "Filters"
			}),
			/* @__PURE__ */ jsx(FilterLabel, { children: "Year" }),
			/* @__PURE__ */ jsx(FilterOption, {
				active: filters.year === "all",
				onClick: () => setFilters({ year: "all" }),
				children: "All Time"
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: "2px"
				},
				children: years.map((y) => /* @__PURE__ */ jsx(FilterOption, {
					active: filters.year === y,
					dim: !yearsWithData.has(y),
					onClick: () => setFilters({ year: y }),
					children: y
				}, y))
			}),
			/* @__PURE__ */ jsx(FilterLabel, { children: "Event Type" }),
			[
				["all", "All Events"],
				["ppv", "PPV Only"],
				["fight_night", "Fight Nights"]
			].map(([val, label]) => /* @__PURE__ */ jsx(FilterOption, {
				active: filters.eventType === val,
				onClick: () => setFilters({ eventType: val }),
				children: label
			}, val)),
			/* @__PURE__ */ jsx(FilterLabel, { children: "Card Position" }),
			[
				["all", "All Fights"],
				["main_card", "Main Card"],
				["main_event", "Main Event Only"]
			].map(([val, label]) => /* @__PURE__ */ jsx(FilterOption, {
				active: filters.cardPosition === val,
				onClick: () => setFilters({ cardPosition: val }),
				children: label
			}, val))
		] })
	});
}
//#endregion
//#region src/components/Layout.tsx
function Layout() {
	const { events } = useData();
	const isMobile = useIsMobile();
	const [drawerOpen, setDrawerOpen] = useState(false);
	return /* @__PURE__ */ jsxs("div", {
		style: { minHeight: "100vh" },
		children: [
			/* @__PURE__ */ jsx(Navbar, {}),
			isMobile && /* @__PURE__ */ jsx("div", {
				style: {
					padding: "0.5rem 1rem",
					borderBottom: "1px solid var(--border)",
					background: "var(--panel)",
					display: "flex",
					alignItems: "center",
					gap: "0.5rem"
				},
				children: /* @__PURE__ */ jsxs("button", {
					onClick: () => setDrawerOpen(true),
					style: {
						background: "none",
						border: "1px solid var(--border)",
						borderRadius: "6px",
						color: "var(--muted)",
						fontSize: "0.8rem",
						fontWeight: 600,
						fontFamily: "'Manrope', sans-serif",
						padding: "0.35rem 0.75rem",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "0.4rem"
					},
					children: [/* @__PURE__ */ jsx("svg", {
						width: "14",
						height: "12",
						viewBox: "0 0 14 12",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						style: { flexShrink: 0 },
						children: /* @__PURE__ */ jsx("path", {
							d: "M0 1h14M2.5 6h9M5 11h4",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round"
						})
					}), "Filters"]
				})
			}),
			isMobile && drawerOpen && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
				style: {
					position: "fixed",
					inset: 0,
					background: "rgba(0,0,0,0.6)",
					zIndex: 300
				},
				onClick: () => setDrawerOpen(false)
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					background: "var(--panel)",
					borderTop: "2px solid var(--border)",
					borderRadius: "16px 16px 0 0",
					zIndex: 301,
					maxHeight: "78vh",
					display: "flex",
					flexDirection: "column"
				},
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							padding: "0.75rem 1rem",
							borderBottom: "1px solid var(--border)",
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexShrink: 0
						},
						children: [/* @__PURE__ */ jsx("span", {
							style: {
								fontWeight: 700,
								fontSize: "0.9rem",
								color: "var(--text)"
							},
							children: "Filters"
						}), /* @__PURE__ */ jsx("button", {
							onClick: () => setDrawerOpen(false),
							style: {
								background: "none",
								border: "none",
								color: "var(--muted)",
								fontSize: "1.1rem",
								cursor: "pointer",
								padding: "0 0.25rem",
								lineHeight: 1
							},
							children: "✕"
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							overflowY: "auto",
							flex: 1
						},
						children: /* @__PURE__ */ jsx(Sidebar, {
							events,
							asDrawer: true
						})
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							padding: "0.75rem 1rem",
							borderTop: "1px solid var(--border)",
							flexShrink: 0
						},
						children: /* @__PURE__ */ jsx("button", {
							onClick: () => setDrawerOpen(false),
							style: {
								width: "100%",
								padding: "0.7rem",
								background: "#E1006A",
								border: "none",
								borderRadius: "8px",
								color: "#fff",
								fontWeight: 700,
								fontSize: "0.9rem",
								fontFamily: "'Manrope', sans-serif",
								cursor: "pointer"
							},
							children: "Apply Filters"
						})
					})
				]
			})] }),
			/* @__PURE__ */ jsxs("div", {
				style: { display: "flex" },
				children: [!isMobile && /* @__PURE__ */ jsx(Sidebar, { events }), /* @__PURE__ */ jsx("main", {
					style: {
						flex: 1,
						minWidth: 0,
						overflowX: "hidden"
					},
					children: /* @__PURE__ */ jsx(Outlet, {})
				})]
			})
		]
	});
}
//#endregion
//#region src/pages/Dashboard.tsx
var SITE_URL$2 = "https://octascore.xyz";
var OG_IMAGE$1 = `${SITE_URL$2}/favicon.png`;
function Dashboard() {
	const { events, predictions, flagged, loading } = useData();
	const [filters] = useFilters();
	const stats = useMemo(() => {
		return ALL_CREATORS.map((slug) => getCreatorStats(slug, predictions, events, filters)).filter((s) => s.eligible > 0).sort((a, b) => b.accuracy - a.accuracy);
	}, [
		predictions,
		events,
		filters
	]);
	const pendingFlags = flagged.filter((f) => !f.manually_resolved).length;
	return /* @__PURE__ */ jsxs("div", {
		className: "page-container",
		style: {
			maxWidth: "1100px",
			margin: "0 auto",
			padding: "1.5rem"
		},
		children: [/* @__PURE__ */ jsxs(Helmet, { children: [
			/* @__PURE__ */ jsx("title", { children: "OctaScore — MMA Prediction Accuracy Tracker | Who Really Knows MMA?" }),
			/* @__PURE__ */ jsx("meta", {
				name: "description",
				content: "Track which MMA YouTubers actually get their picks right. Compare prediction accuracy across events, years, and card positions."
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:title",
				content: "OctaScore — MMA Prediction Accuracy Tracker"
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:description",
				content: "See who's actually sharp vs who just sounds confident. Live accuracy leaderboard for top MMA YouTube predictors."
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:type",
				content: "website"
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:url",
				content: `${SITE_URL$2}/`
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:image",
				content: OG_IMAGE$1
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "twitter:card",
				content: "summary"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "twitter:title",
				content: "OctaScore — MMA Prediction Accuracy Tracker"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "twitter:description",
				content: "See who's actually sharp vs who just sounds confident. Live accuracy leaderboard for top MMA YouTube predictors."
			}),
			/* @__PURE__ */ jsx("link", {
				rel: "canonical",
				href: `${SITE_URL$2}/`
			})
		] }), loading ? /* @__PURE__ */ jsx("div", {
			style: {
				display: "flex",
				justifyContent: "center",
				padding: "4rem",
				color: "var(--text-secondary)"
			},
			children: "Loading data..."
		}) : /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("div", {
				style: { marginBottom: "2rem" },
				children: [
					/* @__PURE__ */ jsx("p", {
						style: {
							color: "var(--text-secondary)",
							fontSize: "0.95rem",
							marginBottom: "0.75rem"
						},
						children: "See how the top MMA YouTubers perform on their picks."
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							color: "var(--text-secondary)",
							fontSize: "0.95rem",
							lineHeight: 1.7,
							marginBottom: "0.5rem"
						},
						children: "Track prediction accuracy across UFC events, compare creator records, and see who's really calling fights right over time. From upset picks to hype-train fades, OCTASCORE lets the MMA community compare predictions with real results."
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							color: "var(--text-secondary)",
							fontSize: "0.95rem",
							marginBottom: "1.25rem"
						},
						children: [
							"Curious why this site exists?",
							" ",
							/* @__PURE__ */ jsx(Link, {
								to: "/about",
								style: {
									color: "var(--highlight)",
									fontWeight: 600
								},
								children: "Read the About page"
							})
						]
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "leaderboard-heading",
						style: {
							fontSize: "1.6rem",
							fontWeight: 800,
							letterSpacing: "-0.01em",
							color: "var(--logo-red)",
							textShadow: "0 0 40px rgba(245, 197, 66, 0.18)"
						},
						children: "Leaderboard"
					})
				]
			}),
			stats.length === 0 ? /* @__PURE__ */ jsx("div", {
				style: {
					color: "var(--text-secondary)",
					padding: "2rem 0",
					textAlign: "center"
				},
				children: "No data for the selected filters."
			}) : /* @__PURE__ */ jsx("div", {
				style: {
					background: "var(--bg-card)",
					borderRadius: "8px",
					border: "1px solid var(--border)",
					overflow: "hidden"
				},
				children: /* @__PURE__ */ jsxs("table", {
					style: {
						width: "100%",
						borderCollapse: "collapse"
					},
					children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
						style: { borderBottom: "1px solid var(--border)" },
						children: [
							{
								label: "Rank",
								center: true
							},
							{ label: "Creator" },
							{ label: "Accuracy" },
							{ label: "Record" },
							{
								label: "Picks Made",
								hide: true
							},
							{
								label: "Main Event Acc",
								hide: true
							},
							{
								label: "PPV Acc",
								hide: true
							}
						].map(({ label, center, hide }) => /* @__PURE__ */ jsx("th", {
							className: hide ? "mobile-hide" : "",
							style: {
								padding: "0.625rem 0.875rem",
								textAlign: center ? "center" : "left",
								fontSize: "0.7rem",
								fontWeight: 700,
								textTransform: "uppercase",
								letterSpacing: "0.06em",
								color: "var(--text-secondary)",
								whiteSpace: "nowrap"
							},
							children: label
						}, label))
					}) }), /* @__PURE__ */ jsx("tbody", { children: stats.map((s, i) => /* @__PURE__ */ jsxs("tr", {
						style: {
							borderBottom: "1px solid var(--border)",
							background: i === 0 ? "rgba(245,197,66,0.04)" : "transparent",
							transition: "background 0.1s"
						},
						onMouseEnter: (e) => e.currentTarget.style.background = "rgba(107,63,152,0.08)",
						onMouseLeave: (e) => e.currentTarget.style.background = i === 0 ? "rgba(245,197,66,0.04)" : "transparent",
						children: [
							/* @__PURE__ */ jsx("td", {
								style: {
									padding: "0.75rem 0.875rem",
									textAlign: "center",
									color: i === 0 ? "var(--gold-primary)" : "var(--text-secondary)",
									fontWeight: 600,
									fontSize: "0.85rem"
								},
								children: i + 1
							}),
							/* @__PURE__ */ jsx("td", {
								className: "mobile-creator-cell",
								style: { padding: "0.75rem 0.875rem" },
								children: /* @__PURE__ */ jsx(Link, {
									to: `/creator/${s.slug}`,
									style: {
										color: "var(--text-primary)",
										fontWeight: 700,
										fontSize: "0.9rem",
										textDecoration: "none"
									},
									onMouseEnter: (e) => e.currentTarget.style.color = "var(--accent-purple)",
									onMouseLeave: (e) => e.currentTarget.style.color = "var(--text-primary)",
									children: s.displayName
								})
							}),
							/* @__PURE__ */ jsx("td", {
								style: { padding: "0.75rem 0.875rem" },
								children: /* @__PURE__ */ jsx("span", {
									style: {
										color: getAccuracyColor(s.accuracy),
										fontWeight: 800,
										fontSize: "1.1rem"
									},
									children: formatPct(s.accuracy)
								})
							}),
							/* @__PURE__ */ jsxs("td", {
								style: {
									padding: "0.75rem 0.875rem",
									color: "var(--text-secondary)",
									fontWeight: 500
								},
								children: [
									/* @__PURE__ */ jsx("span", {
										style: { color: "var(--accent-green)" },
										children: s.correct
									}),
									/* @__PURE__ */ jsx("span", {
										style: { color: "var(--text-secondary)" },
										children: "-"
									}),
									/* @__PURE__ */ jsx("span", {
										style: { color: "var(--accent-red)" },
										children: s.incorrect
									})
								]
							}),
							/* @__PURE__ */ jsx("td", {
								className: "mobile-hide",
								style: {
									padding: "0.75rem 0.875rem",
									color: "var(--text-secondary)",
									fontWeight: 500
								},
								children: s.eligible
							}),
							/* @__PURE__ */ jsx("td", {
								className: "mobile-hide",
								style: { padding: "0.75rem 0.875rem" },
								children: s.mainEventAccuracy !== null ? /* @__PURE__ */ jsx("span", {
									style: {
										color: getAccuracyColor(s.mainEventAccuracy),
										fontWeight: 700
									},
									children: formatPct(s.mainEventAccuracy)
								}) : /* @__PURE__ */ jsx("span", {
									style: { color: "var(--text-secondary)" },
									children: "—"
								})
							}),
							/* @__PURE__ */ jsx("td", {
								className: "mobile-hide",
								style: { padding: "0.75rem 0.875rem" },
								children: s.ppvAccuracy !== null ? /* @__PURE__ */ jsx("span", {
									style: {
										color: getAccuracyColor(s.ppvAccuracy),
										fontWeight: 700
									},
									children: formatPct(s.ppvAccuracy)
								}) : /* @__PURE__ */ jsx("span", {
									style: { color: "var(--text-secondary)" },
									children: "—"
								})
							})
						]
					}, s.slug)) })]
				})
			}),
			/* @__PURE__ */ jsx("p", {
				style: {
					marginTop: "0.75rem",
					color: "var(--text-secondary)",
					fontSize: "0.75rem",
					textAlign: "center"
				},
				children: "Accuracy excludes pick'ems, cancelled fights, and predictions pending review"
			}),
			pendingFlags > 0 && /* @__PURE__ */ jsxs("div", {
				style: {
					border: "1px solid var(--gold-primary)",
					background: "rgba(245,197,66,0.07)",
					borderRadius: "6px",
					padding: "0.625rem 1rem",
					marginTop: "1rem",
					color: "var(--gold-primary)",
					fontSize: "0.8rem",
					fontWeight: 500,
					boxShadow: "0 0 16px rgba(245, 197, 66, 0.10)",
					textAlign: "center"
				},
				children: [
					"⚠ ",
					pendingFlags,
					" prediction",
					pendingFlags !== 1 ? "s" : "",
					" pending manual review — excluded from accuracy calculations"
				]
			})
		] })]
	});
}
//#endregion
//#region src/pages/CreatorDetail.tsx
var SITE_URL$1 = "https://octascore.xyz";
var OG_IMAGE = `${SITE_URL$1}/favicon.png`;
var CREATOR_BIO = {
	mma_joey: "MMA Joey is one of those creators that feels plugged directly into the MMA fanbase — straight-up UFC talk, community debates, fight week reactions, and zero overproduced analyst energy. His prediction style is built around momentum, durability, pressure, and whether a fighter has that \"dog\" in them once things get ugly. Joey's the type to back a gritty underdog everybody counted out or fade a hype train before the rest of the community catches on.",
	mma_guru: "MMA Guru has become one of the biggest voices in MMA YouTube through nonstop coverage, controversial takes, livestreams, and an ability to turn every UFC card into a storyline. His fight predictions go beyond pure technique — he talks confidence, activity, cardio, mentality, durability, and who he thinks folds when the pressure hits. Whether people agree with him or hate-watch him, Guru's picks have become part of the weekly MMA conversation.",
	the_weasel: "The Weasel is the go-to creator for fans who care about the technical side of fighting without all the extra noise. His content is built around detailed film study, stylistic breakdowns, and explaining the small things that decide fights at the highest level. When it comes to predictions, The Weasel focuses heavily on striking habits, defensive tendencies, grappling transitions, and how styles actually interact inside the cage, which is why a lot of hardcore fans trust his reads going into big matchups."
};
var CARD_ORDER = {
	main_event: 0,
	co_main: 1,
	main_card: 2,
	prelim: 3,
	early_prelim: 4
};
function sortPredsByFightOrder(preds, event) {
	return [...preds].sort((a, b) => {
		const fa = event.fights.find((f) => f.fight_id === a.fight_id);
		const fb = event.fights.find((f) => f.fight_id === b.fight_id);
		return (fa ? CARD_ORDER[fa.card_position] ?? 99 : 99) - (fb ? CARD_ORDER[fb.card_position] ?? 99 : 99);
	});
}
function getExclusionReason(p, fight) {
	if (!fight) return "Fight not found";
	if (fight.winner === null) return "Cancelled / No Contest";
	if (p.fight_skipped) return "Skipped";
	if (p.predicted_winner === null) return "Pick 'em";
	if (p.ambiguous && !p.manually_resolved) return "Pending review";
	return "";
}
function CreatorDetail() {
	const { slug } = useParams();
	const navigate = useNavigate();
	const { events, predictions, loading } = useData();
	const [filters] = useFilters();
	const [collapsed, setCollapsed] = useState(/* @__PURE__ */ new Set());
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const isMobile = useIsMobile();
	const sortedCreators = useMemo(() => ALL_CREATORS.filter((s) => CREATOR_DISPLAY[s] && predictions.some((p) => p.creator === s)).sort((a, b) => CREATOR_DISPLAY[a].localeCompare(CREATOR_DISPLAY[b])), [predictions]);
	const creator = slug || "";
	const filtered = useMemo(() => applyFilters(predictions.filter((p) => p.creator === creator), events, filters), [
		predictions,
		events,
		filters,
		creator
	]);
	const stats = useMemo(() => getCreatorStats(creator, predictions, events, filters), [
		creator,
		predictions,
		events,
		filters
	]);
	const eventGroups = useMemo(() => {
		const evMap = /* @__PURE__ */ new Map();
		filtered.forEach((p) => {
			const event = events.find((e) => e.event_id === p.event_id);
			if (!event) return;
			if (!evMap.has(p.event_id)) evMap.set(p.event_id, {
				event,
				preds: []
			});
			evMap.get(p.event_id).preds.push(p);
		});
		return Array.from(evMap.values()).sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime());
	}, [filtered, events]);
	const toggleCollapse = (id) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const displayName = CREATOR_DISPLAY[creator] || creator;
	const pageUrl = `${SITE_URL$1}/creator/${creator}`;
	const description = !loading && stats.eligible > 0 ? `${displayName}'s UFC prediction record: ${stats.correct}W-${stats.incorrect}L (${formatPct(stats.accuracy)} accuracy) across ${stats.eligible} eligible picks.` : `Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Dataset",
		name: `${displayName} — UFC Fight Prediction Accuracy`,
		description,
		url: pageUrl,
		creator: {
			"@type": "Organization",
			name: "OctaScore",
			url: SITE_URL$1
		},
		about: {
			"@type": "Person",
			name: displayName
		},
		...!loading && stats.eligible > 0 && { variableMeasured: [
			{
				"@type": "PropertyValue",
				name: "Prediction Accuracy",
				value: formatPct(stats.accuracy)
			},
			{
				"@type": "PropertyValue",
				name: "Correct Predictions",
				value: stats.correct
			},
			{
				"@type": "PropertyValue",
				name: "Incorrect Predictions",
				value: stats.incorrect
			},
			{
				"@type": "PropertyValue",
				name: "Eligible Picks",
				value: stats.eligible
			}
		] }
	};
	if (loading) return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs(Helmet, { children: [
		/* @__PURE__ */ jsx("title", { children: `${displayName} Prediction Accuracy | OctaScore` }),
		/* @__PURE__ */ jsx("meta", {
			name: "description",
			content: `Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`
		}),
		/* @__PURE__ */ jsx("meta", {
			property: "og:title",
			content: `${displayName} Prediction Accuracy | OctaScore`
		}),
		/* @__PURE__ */ jsx("meta", {
			property: "og:description",
			content: `Track ${displayName}'s UFC fight prediction accuracy across all events and years on OctaScore.`
		}),
		/* @__PURE__ */ jsx("meta", {
			property: "og:type",
			content: "website"
		}),
		/* @__PURE__ */ jsx("meta", {
			property: "og:url",
			content: pageUrl
		}),
		/* @__PURE__ */ jsx("meta", {
			property: "og:image",
			content: OG_IMAGE
		}),
		/* @__PURE__ */ jsx("meta", {
			name: "twitter:card",
			content: "summary"
		}),
		/* @__PURE__ */ jsx("link", {
			rel: "canonical",
			href: pageUrl
		})
	] }), /* @__PURE__ */ jsx("div", {
		style: {
			padding: "4rem",
			textAlign: "center",
			color: "var(--text-secondary)"
		},
		children: "Loading..."
	})] });
	if (!CREATOR_DISPLAY[creator]) return /* @__PURE__ */ jsx("div", {
		style: { padding: "2rem" },
		children: "Creator not found."
	});
	return /* @__PURE__ */ jsxs("div", {
		style: {
			maxWidth: "1000px",
			margin: "0 auto",
			padding: "1.5rem"
		},
		children: [
			/* @__PURE__ */ jsxs(Helmet, { children: [
				/* @__PURE__ */ jsx("title", { children: `${displayName} Prediction Accuracy | OctaScore` }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: description
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: `${displayName} Prediction Accuracy | OctaScore`
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: description
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:type",
					content: "website"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:url",
					content: pageUrl
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:image",
					content: OG_IMAGE
				}),
				/* @__PURE__ */ jsx("meta", {
					name: "twitter:card",
					content: "summary"
				}),
				/* @__PURE__ */ jsx("meta", {
					name: "twitter:title",
					content: `${displayName} Prediction Accuracy | OctaScore`
				}),
				/* @__PURE__ */ jsx("meta", {
					name: "twitter:description",
					content: description
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: pageUrl
				}),
				/* @__PURE__ */ jsx("script", {
					type: "application/ld+json",
					children: JSON.stringify(jsonLd)
				})
			] }),
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					justifyContent: "flex-end",
					marginBottom: "1rem"
				},
				children: /* @__PURE__ */ jsxs("div", {
					style: { position: "relative" },
					children: [
						dropdownOpen && /* @__PURE__ */ jsx("div", {
							style: {
								position: "fixed",
								inset: 0,
								zIndex: 199
							},
							onClick: () => setDropdownOpen(false)
						}),
						/* @__PURE__ */ jsxs("button", {
							onClick: () => setDropdownOpen((o) => !o),
							style: {
								background: "var(--panel)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								color: "var(--text)",
								padding: "0.4rem 0.875rem",
								fontSize: "0.82rem",
								fontFamily: "'Manrope', sans-serif",
								fontWeight: 500,
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								outline: "none"
							},
							children: [CREATOR_DISPLAY[creator], /* @__PURE__ */ jsx("span", {
								style: {
									fontSize: "0.8rem",
									color: "var(--muted)",
									lineHeight: 1
								},
								children: "▾"
							})]
						}),
						dropdownOpen && /* @__PURE__ */ jsx("div", {
							style: {
								position: "absolute",
								top: "calc(100% + 4px)",
								right: 0,
								background: "var(--panel)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								padding: "0.25rem 0",
								minWidth: "180px",
								boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
								zIndex: 200,
								overflow: "hidden"
							},
							children: sortedCreators.map((s) => /* @__PURE__ */ jsx("button", {
								onClick: () => {
									navigate(`/creator/${s}${window.location.search}`);
									setDropdownOpen(false);
								},
								style: {
									display: "block",
									width: "100%",
									textAlign: "left",
									padding: "0.5rem 1rem",
									background: s === creator ? "var(--secondary)" : "none",
									border: "none",
									color: s === creator ? "#fff" : "var(--text)",
									fontSize: "0.82rem",
									fontWeight: s === creator ? 600 : 400,
									cursor: "pointer",
									fontFamily: "inherit",
									transition: "background 0.1s"
								},
								onMouseEnter: (e) => {
									if (s !== creator) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
								},
								onMouseLeave: (e) => {
									if (s !== creator) e.currentTarget.style.background = "none";
								},
								children: CREATOR_DISPLAY[s]
							}, s))
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				style: { marginBottom: "1.5rem" },
				children: [/* @__PURE__ */ jsx("h1", {
					style: {
						fontSize: "1.6rem",
						fontWeight: 800,
						marginBottom: "0.5rem",
						color: "var(--logo-red)"
					},
					children: CREATOR_DISPLAY[creator]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: "2rem",
						alignItems: "baseline"
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: "2.5rem",
							fontWeight: 800,
							color: getAccuracyColor(stats.accuracy),
							lineHeight: 1
						},
						children: formatPct(stats.accuracy)
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
						style: {
							fontWeight: 600,
							fontSize: "0.95rem"
						},
						children: [
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--accent-green)" },
								children: stats.correct
							}),
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--text-secondary)" },
								children: " - "
							}),
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--accent-red)" },
								children: stats.incorrect
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						style: {
							color: "var(--text-secondary)",
							fontSize: "0.8rem"
						},
						children: [stats.eligible, " eligible picks"]
					})] })]
				})]
			}),
			CREATOR_BIO[creator] && /* @__PURE__ */ jsx("div", {
				style: {
					background: "var(--bg-card)",
					border: "1px solid var(--border)",
					borderRadius: "10px",
					padding: "1rem 1.25rem",
					marginBottom: "1.5rem"
				},
				children: /* @__PURE__ */ jsx("p", {
					style: {
						color: "var(--text-secondary)",
						fontSize: "0.88rem",
						lineHeight: 1.7,
						margin: 0
					},
					children: CREATOR_BIO[creator]
				})
			}),
			eventGroups.length === 0 && /* @__PURE__ */ jsx("div", {
				style: {
					color: "var(--text-secondary)",
					textAlign: "center",
					padding: "2rem"
				},
				children: "No predictions for selected filters."
			}),
			eventGroups.map(({ event, preds: rawPreds }) => {
				const preds = sortPredsByFightOrder(rawPreds, event);
				const isCollapsed = collapsed.has(event.event_id);
				const eventElig = eligiblePredictions(preds);
				const eventCorrect = eventElig.filter((p) => p.correct).length;
				const eventAcc = eventElig.length > 0 ? eventCorrect / eventElig.length : null;
				const eventDate = new Date(event.date).toLocaleDateString("en-US", {
					month: "long",
					day: "numeric",
					year: "numeric"
				});
				const eventDateShort = new Date(event.date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric"
				});
				return /* @__PURE__ */ jsxs("div", {
					style: {
						marginBottom: "0.75rem",
						background: "var(--bg-card)",
						borderRadius: "8px",
						border: "1px solid var(--border)",
						overflow: "hidden"
					},
					children: [/* @__PURE__ */ jsx("div", {
						onClick: () => toggleCollapse(event.event_id),
						style: {
							padding: isMobile ? "0.625rem 0.875rem" : "0.75rem 1rem",
							background: "var(--bg-row-alt)",
							cursor: "pointer",
							userSelect: "none"
						},
						children: isMobile ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "0.25rem"
							},
							children: [/* @__PURE__ */ jsx("span", {
								style: {
									fontWeight: 700,
									fontSize: "0.88rem"
								},
								children: event.name
							}), /* @__PURE__ */ jsx("span", {
								style: {
									display: "inline-block",
									transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
									transition: "transform 0.15s ease",
									color: "var(--muted)",
									fontSize: "0.75rem",
									lineHeight: 1,
									marginLeft: "0.5rem",
									flexShrink: 0
								},
								children: "▼"
							})]
						}), /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							},
							children: [/* @__PURE__ */ jsxs("span", {
								style: {
									color: "var(--muted)",
									fontSize: "0.72rem",
									display: "flex",
									alignItems: "center",
									gap: "0.3rem"
								},
								children: [
									/* @__PURE__ */ jsx("span", {
										style: {
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										},
										children: event.event_type === "ppv" ? "PPV" : "Fight Night"
									}),
									/* @__PURE__ */ jsx("span", {
										style: {
											fontSize: "0.85rem",
											opacity: .7
										},
										children: "•"
									}),
									/* @__PURE__ */ jsx("span", { children: eventDateShort })
								]
							}), eventAcc !== null && /* @__PURE__ */ jsxs("span", {
								style: {
									color: getAccuracyColor(eventAcc),
									fontWeight: 700,
									fontSize: "0.78rem"
								},
								children: [
									formatPct(eventAcc),
									" (",
									eventCorrect,
									"/",
									eventElig.length,
									")"
								]
							})]
						})] }) : /* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center"
							},
							children: [/* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									gap: "0.5rem",
									alignItems: "center"
								},
								children: [
									/* @__PURE__ */ jsx("span", {
										style: {
											fontWeight: 700,
											fontSize: "0.9rem"
										},
										children: event.name
									}),
									/* @__PURE__ */ jsx("span", {
										style: {
											color: "var(--muted)",
											fontSize: "1.3rem",
											lineHeight: 1,
											opacity: .8
										},
										children: "•"
									}),
									/* @__PURE__ */ jsx("span", {
										style: {
											color: "var(--text-secondary)",
											fontSize: "0.8rem"
										},
										children: eventDate
									}),
									/* @__PURE__ */ jsx("span", {
										style: {
											color: "var(--muted)",
											fontSize: "1.3rem",
											lineHeight: 1,
											opacity: .8
										},
										children: "•"
									}),
									/* @__PURE__ */ jsx("span", {
										style: {
											color: "var(--text-secondary)",
											fontSize: "0.8rem",
											textTransform: "uppercase",
											letterSpacing: "0.05em"
										},
										children: event.event_type || "Fight Night"
									})
								]
							}), /* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									gap: "1rem",
									alignItems: "center"
								},
								children: [eventAcc !== null && /* @__PURE__ */ jsxs("span", {
									style: {
										color: getAccuracyColor(eventAcc),
										fontWeight: 700,
										fontSize: "0.85rem"
									},
									children: [
										formatPct(eventAcc),
										" (",
										eventCorrect,
										"/",
										eventElig.length,
										")"
									]
								}), /* @__PURE__ */ jsx("span", {
									style: {
										display: "inline-block",
										transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
										transition: "transform 0.15s ease",
										color: "var(--muted)",
										fontSize: "0.8rem",
										lineHeight: 1
									},
									children: "▼"
								})]
							})]
						})
					}), !isCollapsed && /* @__PURE__ */ jsxs("table", {
						className: "creator-detail-table",
						style: {
							width: "100%",
							borderCollapse: "collapse"
						},
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							style: { borderBottom: "1px solid var(--border)" },
							children: [
								{ label: "Fight" },
								{ label: "Their Pick" },
								{ label: "Result" },
								{
									label: "",
									hide: true
								}
							].map(({ label, hide }, idx) => /* @__PURE__ */ jsx("th", {
								className: hide ? "mobile-hide" : "",
								style: {
									padding: "0.5rem 1rem",
									textAlign: "left",
									fontSize: "0.7rem",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.06em",
									color: "var(--text-secondary)"
								},
								children: label
							}, idx))
						}) }), /* @__PURE__ */ jsx("tbody", { children: preds.map((p, i) => {
							const fight = event.fights.find((f) => f.fight_id === p.fight_id);
							const isEligible = p.correct !== null && p.predicted_winner !== null && !p.fight_skipped && (p.ambiguous !== true || p.manually_resolved === true);
							const exclusionReason = !isEligible ? getExclusionReason(p, fight) : "";
							const borderColor = !isEligible ? "transparent" : p.correct ? "var(--success)" : "var(--danger)";
							const rowBg = !isEligible ? "transparent" : p.correct ? "rgba(0,214,143,0.07)" : "rgba(255,77,141,0.07)";
							return /* @__PURE__ */ jsxs("tr", {
								style: {
									borderBottom: i < preds.length - 1 ? "1px solid var(--border)" : "none",
									background: rowBg,
									borderLeft: `3px solid ${borderColor}`,
									opacity: isEligible ? 1 : .6
								},
								children: [
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.625rem 1rem",
											fontStyle: isEligible ? "normal" : "italic",
											fontSize: "0.85rem"
										},
										children: fight ? `${fight.fighter_a} vs ${fight.fighter_b}` : p.fight_id
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.625rem 1rem",
											fontWeight: 600,
											fontSize: "0.85rem",
											color: isEligible ? "var(--text-primary)" : "var(--text-secondary)"
										},
										children: p.predicted_winner || /* @__PURE__ */ jsx("span", {
											style: {
												fontStyle: "italic",
												color: "var(--text-secondary)"
											},
											children: "—"
										})
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.625rem 1rem",
											color: "var(--text-secondary)",
											fontSize: "0.85rem"
										},
										children: fight?.winner || "—"
									}),
									/* @__PURE__ */ jsx("td", {
										className: "mobile-hide",
										style: {
											padding: "0.625rem 1rem",
											fontSize: "0.9rem",
											textAlign: "right",
											paddingRight: "1rem"
										},
										children: isEligible ? /* @__PURE__ */ jsx("span", {
											style: {
												fontWeight: 700,
												color: p.correct ? "var(--accent-green)" : "var(--accent-red)"
											},
											children: p.correct ? "✓" : "✗"
										}) : /* @__PURE__ */ jsx("span", {
											style: {
												fontSize: "0.75rem",
												color: "var(--text-secondary)",
												fontStyle: "italic"
											},
											children: exclusionReason
										})
									})
								]
							}, p.prediction_id);
						}) })]
					})]
				}, event.event_id);
			})
		]
	});
}
//#endregion
//#region src/pages/About.tsx
var SITE_URL = "https://octascore.xyz";
function About() {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			maxWidth: "720px",
			margin: "0 auto",
			padding: "3rem 2rem"
		},
		children: [
			/* @__PURE__ */ jsxs(Helmet, { children: [
				/* @__PURE__ */ jsx("title", { children: "About OctaScore — MMA Prediction Accountability" }),
				/* @__PURE__ */ jsx("meta", {
					name: "description",
					content: "OctaScore tracks and scores MMA YouTube prediction accuracy. Actual numbers, actual receipts — fight by fight, event by event."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:title",
					content: "About OctaScore — MMA Prediction Accountability"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:description",
					content: "Everybody's got a prediction until the scoreboard goes up. OctaScore holds the picks accountable."
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:type",
					content: "website"
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:url",
					content: `${SITE_URL}/about`
				}),
				/* @__PURE__ */ jsx("meta", {
					property: "og:image",
					content: `${SITE_URL}/favicon.png`
				}),
				/* @__PURE__ */ jsx("meta", {
					name: "twitter:card",
					content: "summary"
				}),
				/* @__PURE__ */ jsx("link", {
					rel: "canonical",
					href: `${SITE_URL}/about`
				})
			] }),
			/* @__PURE__ */ jsxs("h1", {
				style: {
					fontSize: "2.2rem",
					fontWeight: 900,
					color: "var(--logo-red)",
					letterSpacing: "-0.02em",
					marginBottom: "0.5rem",
					lineHeight: 1.1
				},
				children: [
					"Talk is cheap.",
					/* @__PURE__ */ jsx("br", {}),
					"Picks are forever."
				]
			}),
			/* @__PURE__ */ jsx("p", {
				style: {
					color: "var(--text-secondary)",
					fontSize: "0.9rem",
					marginBottom: "2.5rem"
				},
				children: "The MMA prediction accountability project."
			}),
			/* @__PURE__ */ jsxs("section", {
				style: { marginBottom: "2rem" },
				children: [
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)",
							marginBottom: "1rem"
						},
						children: "Every fight week, without fail, your favourite MMA YouTubers drop their prediction videos. They've watched the tape. They've studied the styles. They've \"done the research.\" And they will absolutely, confidently, tell you exactly who's going to win — and usually why it's not even going to be close."
					}),
					/* @__PURE__ */ jsxs("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)",
							marginBottom: "1rem"
						},
						children: ["But here's the thing nobody ever checks: ", /* @__PURE__ */ jsx("strong", { children: "are they actually right?" })]
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)"
						},
						children: "Not vibes. Not memory. Not \"I feel like they're usually pretty good.\" Actual numbers. Actual receipts. Fight by fight, event by event, across years of picks."
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				style: { marginBottom: "2rem" },
				children: [
					/* @__PURE__ */ jsx("h2", {
						style: {
							fontSize: "1.25rem",
							fontWeight: 800,
							color: "var(--text-primary)",
							marginBottom: "0.75rem",
							letterSpacing: "-0.01em"
						},
						children: "The MMA community deserves better than vibes"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)",
							marginBottom: "1rem"
						},
						children: "The MMA space is packed with analysts, ex-fighters, obsessive fans, and full-time commentators — all breaking down the same fights, often reaching completely opposite conclusions. Some of them are genuinely sharp. Some of them just sound sharp. Until now, there was no way to tell the difference."
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)"
						},
						children: "That's exactly what OctaScore is built to fix."
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				style: { marginBottom: "2rem" },
				children: [
					/* @__PURE__ */ jsx("h2", {
						style: {
							fontSize: "1.25rem",
							fontWeight: 800,
							color: "var(--text-primary)",
							marginBottom: "0.75rem",
							letterSpacing: "-0.01em"
						},
						children: "We track everything"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)",
							marginBottom: "1rem"
						},
						children: "Not just the main events where everyone agrees anyway. We're talking full card coverage — prelims, main card, championship rounds. PPV blockbusters and Fight Night undercards. Slice it any way you want: how does someone do on main events specifically? How about PPV only? Does their accuracy tank when they have to pick 12 fights instead of 5?"
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							fontSize: "1.05rem",
							lineHeight: 1.8,
							color: "var(--text-primary)"
						},
						children: "The filters are right there. The data doesn't lie."
					})
				]
			}),
			/* @__PURE__ */ jsxs("section", {
				style: { marginBottom: "2rem" },
				children: [/* @__PURE__ */ jsx("h2", {
					style: {
						fontSize: "1.25rem",
						fontWeight: 800,
						color: "var(--text-primary)",
						marginBottom: "0.75rem",
						letterSpacing: "-0.01em"
					},
					children: "Head-to-head, no excuses"
				}), /* @__PURE__ */ jsx("p", {
					style: {
						fontSize: "1.05rem",
						lineHeight: 1.8,
						color: "var(--text-primary)"
					},
					children: "We track multiple creators — all picking the same fights, all on the same playing field. Same events, same card, same results. The leaderboard is live and it's ruthless. Who's actually the sharpest analyst in the room? Check the board. The answer might surprise you."
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					marginTop: "2.5rem",
					padding: "1.25rem 1.5rem",
					borderLeft: `4px solid var(--logo-red)`,
					background: "var(--bg-card)",
					borderRadius: "0 8px 8px 0"
				},
				children: /* @__PURE__ */ jsxs("p", {
					style: {
						fontSize: "1rem",
						lineHeight: 1.7,
						color: "var(--text-secondary)",
						fontStyle: "italic"
					},
					children: [
						"\"Everybody's got a plan until they get punched in the mouth.\" — Mike Tyson.",
						/* @__PURE__ */ jsx("br", {}),
						"Everybody's got a prediction until the scoreboard goes up."
					]
				})
			})
		]
	});
}
//#endregion
//#region src/pages/Admin.tsx
var PASS_HASH = "86beec3c13abe11fb1711a5111cf54d27867694027adf20deb7b0ba749165a42";
var REPO = "prasidmitra/mma-tracker";
async function sha256hex(text) {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function b64decode(b64) {
	return decodeURIComponent(escape(atob(b64.replace(/\s/g, ""))));
}
function b64encode(str) {
	return btoa(unescape(encodeURIComponent(str)));
}
async function ghGet(path, pat) {
	const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers: {
		Authorization: `Bearer ${pat}`,
		Accept: "application/vnd.github.v3+json"
	} });
	if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} — ${await res.text()}`);
	return res.json();
}
async function ghPut(path, pat, data, sha, message) {
	const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${pat}`,
			Accept: "application/vnd.github.v3+json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			message,
			content: b64encode(JSON.stringify(data, null, 2)),
			sha
		})
	});
	if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} — ${await res.text()}`);
	return res.json();
}
var inputStyle = {
	width: "100%",
	padding: "0.5rem 0.75rem",
	background: "var(--bg)",
	border: "1px solid var(--border)",
	borderRadius: "6px",
	color: "var(--text)",
	fontSize: "0.9rem",
	fontFamily: "'Manrope', sans-serif",
	outline: "none"
};
var btnPrimary = {
	padding: "0.5rem 1.25rem",
	background: "var(--primary)",
	border: "none",
	borderRadius: "6px",
	color: "#fff",
	fontSize: "0.85rem",
	fontWeight: 700,
	cursor: "pointer",
	fontFamily: "'Manrope', sans-serif"
};
var btnMuted = {
	...btnPrimary,
	background: "var(--row-alt)",
	color: "var(--muted)"
};
var selectStyle = {
	background: "var(--bg)",
	border: "1px solid var(--border)",
	borderRadius: "4px",
	color: "var(--text)",
	fontSize: "0.82rem",
	fontFamily: "'Manrope', sans-serif",
	padding: "3px 6px"
};
function LoginScreen({ onSuccess }) {
	const [phase, setPhase] = useState("password");
	const [passInput, setPassInput] = useState("");
	const [passError, setPassError] = useState("");
	const [patInput, setPatInput] = useState("");
	async function handlePassword(e) {
		e.preventDefault();
		if (await sha256hex(passInput) === PASS_HASH) setPhase("pat");
		else setPassError("Incorrect password");
	}
	function handlePat(e) {
		e.preventDefault();
		if (!patInput.trim()) return;
		sessionStorage.setItem("admin_pat", patInput.trim());
		onSuccess();
	}
	return /* @__PURE__ */ jsx("div", {
		style: {
			minHeight: "100vh",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			background: "var(--bg)",
			fontFamily: "'Manrope', sans-serif"
		},
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				width: "100%",
				maxWidth: "360px",
				padding: "2rem",
				background: "var(--panel)",
				borderRadius: "12px",
				border: "1px solid var(--border)"
			},
			children: [/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: "1.1rem",
					fontWeight: 800,
					color: "var(--logo-red)",
					marginBottom: "1.5rem",
					letterSpacing: "-0.01em"
				},
				children: "OctaScore Admin"
			}), phase === "password" ? /* @__PURE__ */ jsxs("form", {
				onSubmit: handlePassword,
				children: [
					/* @__PURE__ */ jsx("label", {
						style: {
							display: "block",
							fontSize: "0.78rem",
							fontWeight: 700,
							color: "var(--muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: "0.4rem"
						},
						children: "Password"
					}),
					/* @__PURE__ */ jsx("input", {
						type: "password",
						value: passInput,
						autoFocus: true,
						onChange: (e) => {
							setPassInput(e.target.value);
							setPassError("");
						},
						style: inputStyle
					}),
					passError && /* @__PURE__ */ jsx("div", {
						style: {
							color: "var(--danger)",
							fontSize: "0.8rem",
							marginTop: "0.35rem"
						},
						children: passError
					}),
					/* @__PURE__ */ jsx("button", {
						type: "submit",
						style: {
							...btnPrimary,
							width: "100%",
							marginTop: "1rem"
						},
						children: "Continue"
					})
				]
			}) : /* @__PURE__ */ jsxs("form", {
				onSubmit: handlePat,
				children: [
					/* @__PURE__ */ jsx("label", {
						style: {
							display: "block",
							fontSize: "0.78rem",
							fontWeight: 700,
							color: "var(--muted)",
							textTransform: "uppercase",
							letterSpacing: "0.06em",
							marginBottom: "0.4rem"
						},
						children: "GitHub Personal Access Token"
					}),
					/* @__PURE__ */ jsx("input", {
						type: "password",
						value: patInput,
						placeholder: "ghp_...",
						autoFocus: true,
						onChange: (e) => setPatInput(e.target.value),
						style: inputStyle
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							fontSize: "0.75rem",
							color: "var(--muted)",
							marginTop: "0.4rem",
							lineHeight: 1.5
						},
						children: [
							"Needs ",
							/* @__PURE__ */ jsx("code", { children: "repo" }),
							" scope.",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "https://github.com/settings/tokens",
								target: "_blank",
								rel: "noreferrer",
								style: { color: "var(--highlight)" },
								children: "Create token ↗"
							}),
							/* @__PURE__ */ jsx("br", {}),
							"Stored in sessionStorage only — cleared on tab close."
						]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "submit",
						disabled: !patInput.trim(),
						style: {
							...btnPrimary,
							width: "100%",
							marginTop: "1rem",
							opacity: patInput.trim() ? 1 : .5
						},
						children: "Enter Admin"
					})
				]
			})]
		})
	});
}
function Admin() {
	const [authed, setAuthed] = useState(() => typeof window !== "undefined" && !!sessionStorage.getItem("admin_pat"));
	const { events, predictions, flagged } = useData();
	const [filterCreator, setFilterCreator] = useState("all");
	const [filterEvent, setFilterEvent] = useState("all");
	const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
	const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
	const [predChanges, setPredChanges] = useState({});
	const [flagChanges, setFlagChanges] = useState({});
	const [editingCell, setEditingCell] = useState(null);
	const [saving, setSaving] = useState(false);
	const [saveResult, setSaveResult] = useState(null);
	const flagLookup = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		flagged.forEach((f) => m.set(`${f.creator}|${f.event_id}|${f.fight_id}`, f));
		return m;
	}, [flagged]);
	const eventMap = useMemo(() => new Map(events.map((e) => [e.event_id, e])), [events]);
	const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [events]);
	const filtered = useMemo(() => predictions.filter((p) => {
		if (filterCreator !== "all" && p.creator !== filterCreator) return false;
		if (filterEvent !== "all" && p.event_id !== filterEvent) return false;
		if (showFlaggedOnly && !p.ambiguous) return false;
		if (showUnresolvedOnly && (!p.ambiguous || p.manually_resolved)) return false;
		return true;
	}), [
		predictions,
		filterCreator,
		filterEvent,
		showFlaggedOnly,
		showUnresolvedOnly
	]);
	function applyPredChange(predId, field, value) {
		setPredChanges((prev) => ({
			...prev,
			[predId]: {
				...prev[predId],
				[field]: value
			}
		}));
		setSaveResult(null);
	}
	function applyFlagChange(flagId, change) {
		setFlagChanges((prev) => ({
			...prev,
			[flagId]: change
		}));
		setSaveResult(null);
	}
	const totalChanges = Object.keys(predChanges).length + Object.keys(flagChanges).length;
	async function handleSave() {
		const pat = sessionStorage.getItem("admin_pat");
		if (!pat) {
			setAuthed(false);
			return;
		}
		setSaving(true);
		setSaveResult(null);
		try {
			const byCreator = {};
			for (const predId of Object.keys(predChanges)) {
				const pred = predictions.find((p) => p.prediction_id === predId);
				if (!pred) continue;
				(byCreator[pred.creator] ||= []).push(predId);
			}
			let totalUpdated = 0;
			for (const [creator, predIds] of Object.entries(byCreator)) {
				const path = `data/predictions/${creator}.json`;
				const { content, sha } = await ghGet(path, pat);
				const preds = JSON.parse(b64decode(content));
				for (const predId of predIds) {
					const idx = preds.findIndex((p) => p.prediction_id === predId);
					if (idx !== -1) {
						Object.assign(preds[idx], predChanges[predId]);
						totalUpdated++;
					}
				}
				await ghPut(path, pat, preds, sha, `Admin correction: ${predIds.length} prediction${predIds.length !== 1 ? "s" : ""} updated`);
			}
			if (Object.keys(flagChanges).length > 0) {
				const path = "data/flagged.json";
				const { content, sha } = await ghGet(path, pat);
				const flags = JSON.parse(b64decode(content));
				for (const [flagId, change] of Object.entries(flagChanges)) {
					const idx = flags.findIndex((f) => f.flag_id === flagId);
					if (idx !== -1) Object.assign(flags[idx], change);
				}
				const n = Object.keys(flagChanges).length;
				await ghPut(path, pat, flags, sha, `Admin correction: ${n} flag${n !== 1 ? "s" : ""} resolved`);
			}
			setPredChanges({});
			setFlagChanges({});
			setEditingCell(null);
			setSaveResult({
				ok: true,
				msg: `Saved ${totalUpdated} prediction${totalUpdated !== 1 ? "s" : ""} — GitHub Actions will rebuild the site.`
			});
		} catch (err) {
			setSaveResult({
				ok: false,
				msg: String(err)
			});
		} finally {
			setSaving(false);
		}
	}
	if (!authed) return /* @__PURE__ */ jsx(LoginScreen, { onSuccess: () => setAuthed(true) });
	return /* @__PURE__ */ jsxs("div", {
		style: {
			minHeight: "100vh",
			background: "var(--bg)",
			fontFamily: "'Manrope', sans-serif"
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					background: "var(--panel)",
					borderBottom: "1px solid var(--border)",
					padding: "0.75rem 1.5rem",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					position: "sticky",
					top: 0,
					zIndex: 50
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						fontWeight: 800,
						fontSize: "0.95rem",
						color: "var(--logo-red)",
						letterSpacing: "-0.01em"
					},
					children: "OctaScore Admin"
				}), /* @__PURE__ */ jsx("button", {
					onClick: () => {
						sessionStorage.removeItem("admin_pat");
						setAuthed(false);
					},
					style: btnMuted,
					children: "Log out"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					padding: "1.25rem 1.5rem",
					maxWidth: "1500px",
					margin: "0 auto"
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: "0.75rem",
						alignItems: "center",
						flexWrap: "wrap",
						marginBottom: "1rem",
						background: "var(--panel)",
						padding: "0.75rem 1rem",
						borderRadius: "8px",
						border: "1px solid var(--border)"
					},
					children: [
						/* @__PURE__ */ jsxs("select", {
							value: filterCreator,
							onChange: (e) => setFilterCreator(e.target.value),
							style: selectStyle,
							children: [/* @__PURE__ */ jsx("option", {
								value: "all",
								children: "All Creators"
							}), ALL_CREATORS.map((s) => /* @__PURE__ */ jsx("option", {
								value: s,
								children: CREATOR_DISPLAY[s]
							}, s))]
						}),
						/* @__PURE__ */ jsxs("select", {
							value: filterEvent,
							onChange: (e) => setFilterEvent(e.target.value),
							style: selectStyle,
							children: [/* @__PURE__ */ jsx("option", {
								value: "all",
								children: "All Events"
							}), sortedEvents.map((e) => /* @__PURE__ */ jsx("option", {
								value: e.event_id,
								children: e.name
							}, e.event_id))]
						}),
						/* @__PURE__ */ jsxs("label", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								fontSize: "0.82rem",
								color: "var(--text)",
								cursor: "pointer"
							},
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: showFlaggedOnly,
								onChange: (e) => setShowFlaggedOnly(e.target.checked)
							}), "Flagged only"]
						}),
						/* @__PURE__ */ jsxs("label", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "0.4rem",
								fontSize: "0.82rem",
								color: "var(--text)",
								cursor: "pointer"
							},
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: showUnresolvedOnly,
								onChange: (e) => setShowUnresolvedOnly(e.target.checked)
							}), "Unresolved only"]
						}),
						/* @__PURE__ */ jsxs("span", {
							style: {
								marginLeft: "auto",
								fontSize: "0.78rem",
								color: "var(--muted)"
							},
							children: [
								filtered.length,
								" prediction",
								filtered.length !== 1 ? "s" : ""
							]
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						background: "var(--panel)",
						borderRadius: "8px",
						border: "1px solid var(--border)",
						overflowX: "auto",
						marginBottom: "80px"
					},
					children: [/* @__PURE__ */ jsxs("table", {
						style: {
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "0.82rem"
						},
						children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", {
							style: {
								borderBottom: "1px solid var(--border)",
								background: "var(--bg)"
							},
							children: [
								"Creator",
								"Event",
								"Fight",
								"Predicted Winner",
								"Correct",
								"Flagged",
								"Actions"
							].map((h) => /* @__PURE__ */ jsx("th", {
								style: {
									padding: "0.5rem 0.875rem",
									textAlign: "left",
									fontWeight: 700,
									fontSize: "0.68rem",
									textTransform: "uppercase",
									letterSpacing: "0.07em",
									color: "var(--muted)",
									whiteSpace: "nowrap"
								},
								children: h
							}, h))
						}) }), /* @__PURE__ */ jsx("tbody", { children: filtered.map((p) => {
							const event = eventMap.get(p.event_id);
							const fight = event?.fights.find((f) => f.fight_id === p.fight_id);
							const flag = flagLookup.get(`${p.creator}|${p.event_id}|${p.fight_id}`);
							const changes = predChanges[p.prediction_id] ?? {};
							const flagChange = flag ? flagChanges[flag.flag_id] ?? null : null;
							const currentPW = "predicted_winner" in changes ? changes.predicted_winner : p.predicted_winner;
							const currentCorrect = "correct" in changes ? changes.correct : p.correct;
							const pwChanged = "predicted_winner" in changes;
							const correctChanged = "correct" in changes;
							const isEditPW = editingCell?.predId === p.prediction_id && editingCell.field === "pw";
							const isEditCorrect = editingCell?.predId === p.prediction_id && editingCell.field === "correct";
							return /* @__PURE__ */ jsxs("tr", {
								style: { borderBottom: "1px solid var(--border)" },
								children: [
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											color: "var(--muted)",
											whiteSpace: "nowrap"
										},
										children: CREATOR_DISPLAY[p.creator]
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											whiteSpace: "nowrap"
										},
										children: event?.name ?? p.event_id
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											whiteSpace: "nowrap"
										},
										children: fight ? `${fight.fighter_a} vs ${fight.fighter_b}` : p.fight_id
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											background: pwChanged ? "rgba(250,204,21,0.12)" : "transparent",
											cursor: "pointer",
											whiteSpace: "nowrap"
										},
										onClick: () => !isEditPW && setEditingCell({
											predId: p.prediction_id,
											field: "pw"
										}),
										children: isEditPW ? /* @__PURE__ */ jsxs("select", {
											autoFocus: true,
											value: currentPW ?? "__null__",
											style: selectStyle,
											onChange: (e) => {
												applyPredChange(p.prediction_id, "predicted_winner", e.target.value === "__null__" ? null : e.target.value);
												setEditingCell(null);
											},
											onBlur: () => setEditingCell(null),
											children: [/* @__PURE__ */ jsx("option", {
												value: "__null__",
												children: "null (pick'em)"
											}), fight && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("option", {
												value: fight.fighter_a,
												children: fight.fighter_a
											}), /* @__PURE__ */ jsx("option", {
												value: fight.fighter_b,
												children: fight.fighter_b
											})] })]
										}) : /* @__PURE__ */ jsxs("span", {
											style: {
												color: currentPW ? "var(--text)" : "var(--muted)",
												fontStyle: currentPW ? "normal" : "italic"
											},
											children: [
												currentPW ?? "null",
												" ",
												pwChanged && /* @__PURE__ */ jsx("span", {
													style: {
														fontSize: "0.7rem",
														color: "var(--gold-primary)"
													},
													children: "✎"
												})
											]
										})
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											background: correctChanged ? "rgba(250,204,21,0.12)" : "transparent",
											cursor: "pointer",
											whiteSpace: "nowrap"
										},
										onClick: () => !isEditCorrect && setEditingCell({
											predId: p.prediction_id,
											field: "correct"
										}),
										children: isEditCorrect ? /* @__PURE__ */ jsxs("select", {
											autoFocus: true,
											value: currentCorrect === null ? "__null__" : String(currentCorrect),
											style: selectStyle,
											onChange: (e) => {
												const v = e.target.value === "__null__" ? null : e.target.value === "true";
												applyPredChange(p.prediction_id, "correct", v);
												setEditingCell(null);
											},
											onBlur: () => setEditingCell(null),
											children: [
												/* @__PURE__ */ jsx("option", {
													value: "__null__",
													children: "null"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "true",
													children: "✓ true"
												}),
												/* @__PURE__ */ jsx("option", {
													value: "false",
													children: "✗ false"
												})
											]
										}) : /* @__PURE__ */ jsxs("span", {
											style: {
												color: currentCorrect === true ? "var(--accent-green)" : currentCorrect === false ? "var(--accent-red)" : "var(--muted)",
												fontWeight: currentCorrect !== null ? 700 : 400,
												fontStyle: currentCorrect === null ? "italic" : "normal"
											},
											children: [
												currentCorrect === true ? "✓" : currentCorrect === false ? "✗" : "null",
												" ",
												correctChanged && /* @__PURE__ */ jsx("span", {
													style: {
														fontSize: "0.7rem",
														color: "var(--gold-primary)"
													},
													children: "✎"
												})
											]
										})
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											minWidth: "220px"
										},
										children: p.ambiguous && flag ? /* @__PURE__ */ jsxs("div", { children: [
											/* @__PURE__ */ jsxs("div", {
												title: flag.ambiguity_reason,
												style: {
													color: "var(--gold-primary)",
													fontSize: "0.78rem",
													marginBottom: "0.3rem",
													cursor: "help"
												},
												children: ["⚑ ", /* @__PURE__ */ jsx("span", {
													style: { textDecoration: "underline dotted" },
													children: flag.ambiguity_reason.length > 45 ? flag.ambiguity_reason.slice(0, 45) + "…" : flag.ambiguity_reason
												})]
											}),
											/* @__PURE__ */ jsxs("label", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "0.35rem",
													fontSize: "0.78rem",
													color: "var(--text)",
													cursor: "pointer"
												},
												children: [/* @__PURE__ */ jsx("input", {
													type: "checkbox",
													checked: flagChange?.manually_resolved ?? flag.manually_resolved,
													onChange: (e) => applyFlagChange(flag.flag_id, {
														manually_resolved: e.target.checked,
														resolved_winner: flagChange?.resolved_winner ?? flag.resolved_winner
													})
												}), "Mark resolved"]
											}),
											(flagChange?.manually_resolved ?? flag.manually_resolved) && /* @__PURE__ */ jsx("input", {
												type: "text",
												placeholder: "Resolved winner name",
												value: flagChange?.resolved_winner ?? flag.resolved_winner ?? "",
												onChange: (e) => applyFlagChange(flag.flag_id, {
													manually_resolved: true,
													resolved_winner: e.target.value || null
												}),
												style: {
													...inputStyle,
													fontSize: "0.78rem",
													padding: "3px 8px",
													marginTop: "0.3rem",
													width: "180px"
												}
											})
										] }) : p.ambiguous ? /* @__PURE__ */ jsx("span", {
											style: {
												color: "var(--gold-primary)",
												fontSize: "0.78rem"
											},
											children: "⚑ no flag record"
										}) : /* @__PURE__ */ jsx("span", {
											style: { color: "var(--border)" },
											children: "—"
										})
									}),
									/* @__PURE__ */ jsx("td", {
										style: {
											padding: "0.5rem 0.875rem",
											whiteSpace: "nowrap"
										},
										children: p.video_id ? /* @__PURE__ */ jsx("a", {
											href: `https://youtube.com/watch?v=${p.video_id}`,
											target: "_blank",
											rel: "noreferrer",
											style: {
												color: "var(--highlight)",
												fontSize: "0.78rem",
												fontWeight: 600,
												textDecoration: "none"
											},
											children: "View Video ↗"
										}) : /* @__PURE__ */ jsx("span", {
											style: { color: "var(--border)" },
											children: "—"
										})
									})
								]
							}, p.prediction_id);
						}) })]
					}), filtered.length === 0 && /* @__PURE__ */ jsx("div", {
						style: {
							padding: "3rem",
							textAlign: "center",
							color: "var(--muted)"
						},
						children: "No predictions match the current filters."
					})]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					background: "var(--panel)",
					borderTop: "1px solid var(--border)",
					padding: "0.75rem 1.5rem",
					display: "flex",
					alignItems: "center",
					gap: "1rem",
					zIndex: 100
				},
				children: [
					/* @__PURE__ */ jsx("button", {
						onClick: handleSave,
						disabled: saving || totalChanges === 0,
						style: {
							...btnPrimary,
							opacity: totalChanges === 0 || saving ? .5 : 1
						},
						children: saving ? "Saving…" : totalChanges > 0 ? `Save ${totalChanges} change${totalChanges !== 1 ? "s" : ""}` : "Save"
					}),
					totalChanges > 0 && !saving && /* @__PURE__ */ jsx("button", {
						onClick: () => {
							setPredChanges({});
							setFlagChanges({});
							setSaveResult(null);
						},
						style: btnMuted,
						children: "Discard"
					}),
					saveResult ? /* @__PURE__ */ jsxs("span", {
						style: {
							fontSize: "0.85rem",
							color: saveResult.ok ? "var(--accent-green)" : "var(--accent-red)"
						},
						children: [
							saveResult.ok ? "✓ " : "✗ ",
							saveResult.msg,
							saveResult.ok && /* @__PURE__ */ jsxs(Fragment, { children: [" — ", /* @__PURE__ */ jsx("a", {
								href: "https://github.com/prasidmitra/mma-tracker/actions",
								target: "_blank",
								rel: "noreferrer",
								style: { color: "var(--highlight)" },
								children: "View Actions ↗"
							})] })
						]
					}) : totalChanges === 0 ? /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: "0.82rem",
							color: "var(--muted)"
						},
						children: "No unsaved changes"
					}) : null
				]
			})
		]
	});
}
//#endregion
//#region src/AppRoutes.tsx
function AppRoutes() {
	return /* @__PURE__ */ jsxs(Routes, { children: [
		/* @__PURE__ */ jsxs(Route, {
			element: /* @__PURE__ */ jsx(Layout, {}),
			children: [/* @__PURE__ */ jsx(Route, {
				index: true,
				element: /* @__PURE__ */ jsx(Dashboard, {})
			}), /* @__PURE__ */ jsx(Route, {
				path: "creator/:slug",
				element: /* @__PURE__ */ jsx(CreatorDetail, {})
			})]
		}),
		/* @__PURE__ */ jsx(Route, {
			path: "about",
			element: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsx(About, {})] })
		}),
		/* @__PURE__ */ jsx(Route, {
			path: "admin",
			element: /* @__PURE__ */ jsx(Admin, {})
		})
	] });
}
//#endregion
//#region src/entry-server.tsx
function render(route, basename) {
	const helmetContext = {};
	const html = renderToString(/* @__PURE__ */ jsx(HelmetProvider, {
		context: helmetContext,
		children: /* @__PURE__ */ jsx(StaticRouter, {
			location: basename.replace(/\/$/, "") + (route === "/" ? "" : route) || "/",
			basename,
			children: /* @__PURE__ */ jsx(ThemeProvider, { children: /* @__PURE__ */ jsx(DataProvider, { children: /* @__PURE__ */ jsx(AppRoutes, {}) }) })
		})
	}));
	const { helmet } = helmetContext;
	return {
		html,
		helmet
	};
}
//#endregion
export { render };
