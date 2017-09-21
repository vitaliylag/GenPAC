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



const funcs = require('./lib/funcs.js'),
      conf = funcs.parseArgs('output-pac/globalObject.js', 'output-js/globalObject.js');



funcs.saveFiles(conf, `

var domains = ${funcs.json_object(conf.hosts, 2)};
var ips = ${funcs.json_object(conf.ips, 0)};

function FindProxyForURL(url, host) {
	//Remove last dot
	if (host[host.length - 1] === '.') {
		host = host.substring(0, host.length - 1);
	}
	
	//Convert to second-level domain
	var x = host.lastIndexOf('.');
	if (x !== -1) {
		x = host.lastIndexOf('.', x - 1);
		if (x !== -1) {
			host = host.substr(x + 1);
		}
	}
	
	//Return result
	if (host in domains || dnsResolve(host) in ips) {
		return '${conf.proxyString}';
	}else{
		return '${conf.directString}';
	}
}`);
