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
      conf = funcs.parseArgs('output-pac/binSearch_string_good.js', 'output-js/binSearch_string_good.js');



funcs.saveFiles(conf, `

function FindProxyForURL(url, host) {
	var useProxy = false;
	
	//1. Remove last dot
	if (host[host.length - 1] === '.') {
		host = host.substring(0, host.length - 1);
	}
	
	//2. Check all subhosts (from example.com to x.y.z.example.com)
	if (true) {
		/*
		In this block we start loop from (host.lastIndexOf('.') - 1) instead of (host.length - 1).
		
		That means:
		1) We have already skipped 1 dot and one level so curLevel should be 1 instead of 0 at start.
		2) We don't check top-level domain (like com, org, ru).
		*/
		
		var curLevel = 1;
		
		for (var x = host.lastIndexOf('.') - 1; x >= 0; x--) {
			if (host[x] === '.') {
				if (++curLevel <= 5 && !useProxy) {
					useProxy = isHostBlocked(host.substring(x + 1, host.length));
				}
			}
		}
		
		//Check full host
		if (++curLevel <= 5 && !useProxy) {
			useProxy = isHostBlocked(host);
		}
	}
	
	//3. Check IP
	if (!useProxy) {
		var ips = '',
		    ip = dnsResolve(host);
		
		${funcs.code_binsearch_strings(conf.ips, 0,   2, 'ips', 'ip.length')}
		
		useProxy = isBlocked(ips, ip);
	}
	
	if (useProxy) {
		return '${conf.proxyString}';
	}else{
		return '${conf.directString}';
	}
	
	
	
	function isHostBlocked(host) {
		var s = '';
		
		${funcs.code_binsearch_strings(conf.hosts, 5,   2, 's', 'host.length')}
		
		return isBlocked(s, host);
	}
	
	
	
	function isBlocked(s, match) {   //Requires s - blocked things of the same length concatenated to one string
		if (!s) return false;
		
		var matchLen = match.length,
		    l = 0,
		    r = s.length / matchLen - 1;
		
		while (l < r) {
			var x = (l + r) >>> 1,
			    offset = x * matchLen;
			
			if (s.substring(offset, offset + matchLen) < match) {
				l = x + 1;
			}else{
				r = x;
			}
		}
		
		return s.substring(l * matchLen, l * matchLen + matchLen) === match;
	}
}`);
