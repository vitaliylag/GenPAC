/*
Copyright (c) 2017 Vitaliy Lagunov

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/



'use strict';



/*
Function list:
- parseArgs
- saveFiles
- getSortedArrayFromFile
- json_array
- json_object
- code_binsearch_strings
*/



const fs = require('fs');



const funcs = exports;



//parseArgs
funcs.parseArgs = (pac, js) => {
	const conf = require('./config.js'),
	      argv = process.argv;
	
	conf.pac = pac;
	conf.js = js;
	
	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		
		switch (arg) {
			case '--help':
			case '-h':
			case '-?':
			case '/help':
			case '/h':
			case '/?':
				return exit(`
					Usage: node SCRIPT_NAME [--proxyString PROXY_STRING] [--directString DIRECT_STRING] [--hosts HOSTS_PATH] [--ips IPS_PATH] [--pac PAC_PATH] [--js JS_PATH]
					
					--proxyString VAL   string returned when query should be proxied       default: ${conf.proxyString}
					--directString VAL  string returned when query should not be proxied   default: ${conf.directString}
					
					--hosts VAL         input hosts file path ("" for ignore)              default: ${conf.hosts}
					--ips VAL           input ips   file path ("" for ignore)              default: ${conf.ips}
					--pac VAL           output pac  file path ("" for ignore)              default: ${conf.pac}
					--js VAL            output js   file path ("" for ignore)              default: ${conf.js}
					
					See readme.md for description of scripts.
				`.replace(/\t+/g, '').trim());
			
			default:
				if (arg.startsWith('--')) {
					const argName = arg.substr(2);
					
					if (conf.hasOwnProperty(argName)) {
						if (i + 1 < argv.length) {
							conf[argName] = argv[++i];
						}else{
							exit(`Value of ${arg} argument is not specified`);
						}
					}
				}
		}
	}
	
	return conf;
	
	
	
	function exit(s) {
		console.log('\n' + s);
		process.exit(0);
		throw 'exit';
	}
};



//saveFiles
funcs.saveFiles = (conf, code) => {
	code = code.trim();
	conf.pac && fs.writeFileSync(conf.pac, code + '\n');
	conf.js  && fs.writeFileSync(conf.js,  code.replace('function FindProxyForURL', 'module.exports = function') + ';\n');
};



//getSortedArrayFromFile
funcs.getSortedArrayFromFile = (path, maxDomainLevels) => {
	const entries = tryF([], () => fs.readFileSync(path).toString().split(/[\r\n]+/g)),
	      arr = [];
	
	//1. Generate sorted array without: 1) *.  2) start and end dots  3) subdomains with level greater than maxDomainLevels
	
	for (let i = 0; i < entries.length; i++) {
		let entry = entries[i].replace(/\.+$|^[\*\.]/, '');
		
		if (maxDomainLevels) {
			for (let x = entry.length - 1, curLevel = 0; x >= 0; x--) {
				if (entry[x] === '.') {
					if (++curLevel === maxDomainLevels) {
						entry = entry.substr(x + 1);
					}
				}
			}
		}
		
		arr.push(entry);
	}
	
	arr.sort();
	
	//2. Generate sorted array without: 1) same entries
	
	const arr2 = [];
	
	if (arr.length) {
		arr2.push(arr[0]);
	}
	
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] !== arr[i - 1]) {
			arr2.push(arr[i]);
		}
	}
	
	
	
	return arr2;
};



//json_array
funcs.json_array = (path, maxDomainLevels) => {
	return JSON.stringify(funcs.getSortedArrayFromFile(path, maxDomainLevels));
};



//json_object
funcs.json_object = (path, maxDomainLevels) => {
	const arr = funcs.getSortedArrayFromFile(path, maxDomainLevels),
	      obj = {};
	
	for (let i = 0; i < arr.length; i++) {
		obj[arr[i]] = 1;
	}
	
	return JSON.stringify(obj);
};



//code_binsearch_strings
funcs.code_binsearch_strings = (path, maxDomainLevels,   tabLen, varName_res, varName_len) => {
	const entriesByLen = getEntriesByLen(path, maxDomainLevels);
	const code  = [`switch (${varName_len}) {`];
	const code2 = [`switch (${varName_len}) {`]; //For domains with length >= 100
	const tab = '\t'.repeat(tabLen);
	
	for (let i = 0; i < entriesByLen.length; i++) {
		if (entriesByLen[i]) {
			const line = `${tab}\tcase ${i}: ${varName_res} = '${entriesByLen[i].join('')}'; break;`;
			i < 120 ? code.push(line) : code2.push('\t' + line);
		}
	}
	code.push(tab + '}');
	code2.push(tab + '\t}');
	
	return code.join('\n') + (code2.length > 2 ? `
!		
!		if (${varName_len} >= 100) {
!			${code2.join('\n')}
!		}`
	.replace(/\n\t*!\t{0,2}/g, '\n' + tab) : '');
	
	
	
	function getEntriesByLen(path, maxDomainLevels) {
		const arr = funcs.getSortedArrayFromFile(path, maxDomainLevels),
		      entriesByLen = [];
		
		for (let i = 0; i < arr.length; i++) {
			const entry = arr[i];
			
			let a = entriesByLen[entry.length];
			if (!a) {
				a = entriesByLen[entry.length] = [];
			}
			
			a.push(entry);
		}
		
		if (entriesByLen.length > 1000) {
			entriesByLen.length = 1000;
		}
		
		return entriesByLen;
	}
};





//tryF
function tryF(onErr, f) {
	try {
		return f();
	} catch(e) {
		return typeof onErr === 'funtion' ? onErr() : onErr;
	}
}
