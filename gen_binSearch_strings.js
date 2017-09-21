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
      conf = funcs.parseArgs('output-pac/binSearch_string.pac', 'output-js/binSearch_string.js');



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
	var domains = '', ips = '';
	var ip = dnsResolve(host);
	
	${funcs.code_binsearch_strings(conf.hosts, 5,   1, 'domains', 'host.length')}
	
	${funcs.code_binsearch_strings(conf.ips, 0,   1, 'ips', 'ip.length')}
	
	//Return result
	if (checkBlocked(domains, host) || checkBlocked(ips, ip)) {
		return '${conf.proxyString}';
	}else{
		return '${conf.directString}';
	}
	
	
	
	function checkBlocked(s, match) {
		if (!s) return false;
		
		var matchLen = match.length;
		var l = 0, r = s.length / matchLen - 1;
		
		while (l < r) {
			var x = (l + r) >>> 1;
			var offset = x * matchLen;
			
			if (s.substring(offset, offset + matchLen) < match) {
				l = x + 1;
			}else{
				r = x;
			}
		}
		
		return s.substring(l * matchLen, l * matchLen + matchLen) === match;
	}
}`);
