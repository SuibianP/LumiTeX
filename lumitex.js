function obr_cb(details) {
	console.log("listener callback triggered " + "url: " + details.url + "id: " + details.requestId);
	let filter = browser.webRequest.filterResponseData(details.requestId);
	let data = [];
	filter.onstart = event => {
    	console.log("onstart");
  	}
	filter.onerror = event => {
    	console.log(`Error: ${filter.error}`);
  	}
	filter.ondata = event => {
		console.log("ondata");
		data.push(event.data);
		filter.write(event.data);
	};
	filter.onstop = async(event) => {
		function parseQuestions(obj) {
			const parser = new DOMParser();
			parser.parseFromString(obj.text, "text/html");
			obj.sortedOptions.map(a => parser.parseFromString(a, "text/html"));
		}
		console.log("onstop");
		let concatBuffer = new Blob(data).arrayBuffer();
		let jsonText = new TextDecoder().decode(await concatBuffer);
		let jsonObj = JSON.parse(jsonText);
		document.body.innerHTML = "";
		function addin(str) {
			const parser = new DOMParser();
			// input encoded html string, output a single string delimited by qquad
			elements = parser.parseFromString(str, "text/html").getElementsByClassName("math-tex");
			concated = Array.prototype.map.call(elements, a => a.textContent).join("\n");
			// do necessary replacements here
			concated = concated.match(/(?<=\\begin{.matrix}).+?(?=\\end{.matrix})/g);
			if (concated == null) {
				return;
			}
			concated = concated.map(a=>('[' + a.replaceAll(/\\frac{(.+?)}{(.+?)}/g, "$1/$2").replaceAll(/\\sqrt{(.+?)}/g, "sqrt($1)").replaceAll("\\sin(", "sin(").replaceAll("\\cos(", "cos(").replaceAll("\\tan(", "tan(").replaceAll(/\^{(.+?)}/g, "^($1)").replaceAll("&", ", ").replaceAll("\\\\", "; ")+']\n'));
			if (concated == null) {
				return;
			}
			document.body.appendChild(document.createElement('hr'));
			document.body.appendChild(document.createTextNode(concated));
		}
		for (qn of jsonObj.data) {
			addin(qn.text);
			for (ch of qn.sortedOptions) {
				addin(ch.text);
			}
		}
		filter.disconnect();
	};
}
browser.webRequest.onBeforeRequest.addListener(
	obr_cb,
	{urls: ['*://luminus.nus.edu.sg/v2/api/assessment/session/*/question?*']},
	["blocking"]
);
console.log("Listener added")
