export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname == "/favicon.ico") {
			return new Response(null, { status: 404 });
		}
		try {
			const ghCode = new GitHubCode(url);
			return new Response(await ghCode.getBody(), { headers: new Headers({ "Content-Type": "text/javascript; charset=UTF-8" }) });
		} catch (e) {
			const message = `${e}`;
			const errBody = `(function() { document.currentScript.insertAdjacentHTML("afterend", ${ JSON.stringify(message) }) })();`;
			return new Response(errBody, { status: 200, headers: new Headers({ "Content-Type": "text/javascript; charset=UTF-8" }) });
		}
	},
} satisfies ExportedHandler<Env>;

class GitHubCode {
	pathUser: string;
	pathRepo: string;
	pathBlobOrRaw: string;
	pathBranchOrTagOrCommit: string;
	pathFile: string;
	fetchJdUrl: string;
	fetchGhUrl: string;
	blobUrl: string;
	leafFileName: string;
	sliceStart: number = 1;
	sliceEnd: number = Number.NaN;
	footer: boolean | "minimal" = true;
	highlight: boolean = true;
	lang?: string = undefined;
	skin: "default" | "desert" | "sunburst" | "sons-of-obsidian" | "doxy" = "sons-of-obsidian";
	fetchfrom: "github" | "jsdelivr" = "jsdelivr";
	constructor(url: URL) {
		// parse path
		const matPath = url.pathname.match(/^\/github\/(?<user>[^\/]+)\/(?<repo>[^\/]+)\/(?<blobOrRaw>blob|raw)\/(?<branchOrTagOrCommit>[^\/]+)\/(?<pathFile>.+)$/);
		if (!matPath) {
			throw new Error(`not supported path: ${ url.pathname }`);
		}
		this.pathUser = matPath.groups!["user"];
		this.pathRepo = matPath.groups!["repo"];
		this.pathBlobOrRaw = matPath.groups!["blobOrRaw"];
		this.pathBranchOrTagOrCommit = matPath.groups!["branchOrTagOrCommit"];
		this.pathFile = matPath.groups!["pathFile"];

		this.fetchJdUrl = `https://cdn.jsdelivr.net/gh/${ this.pathUser }/${ this.pathRepo }@${ this.pathBranchOrTagOrCommit }/${ this.pathFile }`;
		this.fetchGhUrl = `https://github.com/${ this.pathUser }/${ this.pathRepo }/raw/${ this.pathBranchOrTagOrCommit }/${ this.pathFile }`;
		this.blobUrl = `https://github.com/${ this.pathUser }/${ this.pathRepo }/blob/${ this.pathBranchOrTagOrCommit }/${ this.pathFile }`;
		this.leafFileName = `${ url.pathname.split('/').pop() }`;
		if (this.leafFileName.endsWith(".md")) {
			this.blobUrl += "?plain=1";
		}
		
		// parse option
		const optSlice = url.searchParams.get("slice");
		if (optSlice) {
			const matSlice = optSlice.match(/(-?\d*)(?:(:)(-?\d*))?/);
			if (matSlice && matSlice[1] != "") {
				this.sliceStart = parseInt(matSlice[1]);
			}
			if (matSlice && matSlice[2] != ":") {
				this.sliceEnd = parseInt(matSlice[1]);
			} else if (matSlice && matSlice[3] != "") {
				this.sliceEnd = parseInt(matSlice[3]);
			}
		}
		const optFooter = url.searchParams.get("footer");
		if (optFooter) {
			if (optFooter === "minimal") {
				this.footer = "minimal";
			} else {
				this.footer = !/^(false|0|none|no)$/i.test(optFooter);
			}
		}
		const optHighlight = url.searchParams.get("highlight");
		if (optHighlight) {
			this.highlight = !/^(false|0|none|no)$/i.test(optHighlight);
		}
		const optLang = url.searchParams.get("lang");
		if (optLang) {
			this.lang = optLang;
		}
		const optSkin = url.searchParams.get("skin");
		if (optSkin) {
			switch (optSkin.toLowerCase()) {
				case "default":
					this.skin = "default";
					break;
				case "desert":
					this.skin = "desert";
					break;
				case "sunburst":
					this.skin = "sunburst";
					break;
				case "sons-of-obsidian":
					this.skin = "sons-of-obsidian";
					break;
				case "doxy":
					this.skin = "doxy";
					break;
			}
		}
		const optFetchfrom = url.searchParams.get("fetchfrom");
		if (optFetchfrom) {
			switch (optFetchfrom.toLowerCase()) {
				case "github":
					this.fetchfrom = "github";
					break;
				case "jsdelivr":
					this.fetchfrom = "jsdelivr";
					break;
			}
		}
	}
	async getBody() {
		const repoUrl = 'https://github.com/advanceboy/gistizer';
		const prettifyUrl = `https://cdn.jsdelivr.net/gh/google/code-prettify/loader/run_prettify.js?callback=prettyPrintCallbackForGistizer${ this.skin !== "default" ? `&skin=${ this.skin }` : "" }`;
		return `(function () {
			const write = function (markup) { document.currentScript.insertAdjacentHTML("afterend", markup); };
			` + (this.highlight ? `if (!('PR' in window)) {
			    window.exports = window.exports ?? [];
				window.exports["prettyPrintCallbackForGistizer"] = function () { window.PR.prettyPrint(); };
				const elmCurrentScript = document.currentScript;
				const elmNewScript = document.createElement('script');
				elmNewScript.src = ${ JSON.stringify(prettifyUrl) };
				elmCurrentScript.parentNode.insertBefore(elmNewScript, elmCurrentScript.nextSibling);
			};
			` : "") + `
			write(${ JSON.stringify(
				`
				<div class="gistizer-gist"><div class="gistizer-file"><div class="gistizer-data"><pre class="prettyprint${ this.lang ? (' lang-' + this.lang) : '' } linenums${ this.sliceStart != 1 ? (':' + this.sliceStart) : '' }" style="margin-bottom: 0;">\n${
					await this.fetchCodesEscaped()
				}</pre></div>${
					!this.footer ? '' : `<div class="gistizer-meta" style="color: rgb(102, 102, 102); padding: 2px; border: 1px solid black;">${
						this.footer !== "minimal" ? `<span><a style="color: rgb(102, 102, 102);" href="${ encodeURI(this.blobUrl) }">This Gist</a> brought to you by <a style="color: rgb(102, 102, 102);" href="${ encodeURI(repoUrl) }">gistizer</a>.</span>` : "&nbsp;"
					}${
						`<span style="float: right; margin-right: 8px;"><a style="color: rgb(102, 102, 102);" href="${ encodeURI(this.blobUrl) }">${ GitHubCode.encodeHtml(this.leafFileName) }</a></span>`
					}</div>` // /div.gistizer-meta
				}</div></div>
				`	// /div.gistizer-file, /div.gistizer-gist
			) });
			if ('PR' in window) { window.PR.prettyPrint(); }
})();`;
	}
	async fetchCodesEscaped() {
		return GitHubCode.encodeHtml((await this.fetchCodes()).join("\n"));
	}
	async fetchCodes() {
		let url;
		switch (this.fetchfrom) {
			case "jsdelivr":
				url = this.fetchJdUrl;
				break;
			case "github":
				url = this.fetchGhUrl;
				break;
			default:
				throw new Error(`unexpected fetchfrom: ${ this.fetchfrom }`);
		}

		const res = await fetch(url);
		if (res.status != 200) {
			throw new Error(await res.text());
		}
		const codeArray = (await res.text()).split(/\r\n|\n|\r/);

		const sliceStart = this.sliceStart >= 0 ? this.sliceStart : codeArray.length + this.sliceStart;
		const sliceEnd = this.sliceEnd >= 0 ? this.sliceEnd : codeArray.length + this.sliceEnd;
		if (sliceStart != 1 || !isNaN(this.sliceEnd)) {
			if (sliceStart === sliceEnd || isNaN(sliceEnd)) {
				this.blobUrl += '#L' + sliceStart;
			} else {
				this.blobUrl += '#L' + sliceStart + '-L' + sliceEnd;
			}
		}
		if (Number.isNaN(this.sliceEnd) && this.sliceStart != 1) {
			return codeArray.slice(sliceStart - 1);
		} else if (!Number.isNaN(this.sliceEnd)) {
			return codeArray.slice(sliceStart - 1, sliceEnd);
		} else {
			return codeArray;
		}
	}

	static encodeHtml(str: string) {
		return str.replace(/&|<|>/g, m => {
			if (m == "&") {
				return "&amp;";
			} else if (m == "<") {
				return "&lt;";
			} else if (m == ">") {
				return "&gt;"
			} else {
				throw new Error("");
			}
		});
	}
}
