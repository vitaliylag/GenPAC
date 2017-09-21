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
      conf = funcs.parseArgs('output-pac/binSearch_array.js', 'output-js/binSearch_array.js');



funcs.saveFiles(conf, `

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
	
	//Database
	var domains = ${funcs.json_array(conf.hosts, 2)};
	var ips = ${funcs.json_array(conf.ips, 2)};
	
	//Return result
	if (checkBlocked(domains, host) || checkBlocked(ips, dnsResolve(host))) {
		return '${conf.proxyString}';
	}else{
		return '${conf.directString}';
	}
	
	function checkBlocked(a, match) {
		var l = 0, r = a.length - 1;
		
		while (l < r) {
			var x = (l + r) >>> 1;
			
			if (a[x] < match) {
				l = x + 1;
			}else{
				r = x;
			}
		}
		
		return a[l] === match;
	}
}`);
