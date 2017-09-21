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



/*
Benchmark.

Launch:
node --expose-gc bench
node --expose-gc bench AntiZapret
node --expose-gc --noopt --no-always-opt bench
node --expose-gc --noopt --no-always-opt bench AntiZapret
*/



'use strict';



/*
Code map:
1. Consts
2. Polyfills
3. Body
4. Functions
*/



//=== Consts ===



const PATH = process.argv[2],
      TIMES1 = 10,
      TIMES2 = 100,
      TIMES3 = 1000,
      TIMES4 = PATH === 'AntiCenz' ? 1000 : 10000,
      HOST_PREFIX = '10.9.8.7.6.5.4.3.example';



//=== Polyfills ===



let canMesureMem = true;

(function(global) {
	if (!global.performance) {
		global.performance = {now: function() {
			var a = process.hrtime();
			return a[0] * 1000 + a[1] / 1000000;
		}};
	}
	
	if (!global.gc) {
		canMesureMem = false;
		global.gc = function() {};
	}
	
	global.dnsResolve = function(host) {
		return '1.1.1.1';
	};
})(typeof(global) === 'undefined' ? window : global);



//=== Body ===



if (!PATH) {
	return console.log('Usage: node bench PATH');
}

try {
	require('./' + PATH);
} catch(e) {
	return console.log('Cannot use ' + PATH + ' file');
}

gc();

setTimeout(() => {
	const startMem = memoryUsage();
	const startTime = performance.now();
	
	const FindProxyForURL = require('./' + PATH);
	let ans = FindProxyForURL('http://a.example.com/', `${HOST_PREFIX}.com`);
	let ansLen = ans.length;
	const time0 = performance.now();
	
	for (let i = 0;      i < TIMES1; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time1 = performance.now();
	for (let i = TIMES1; i < TIMES2; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time2 = performance.now();
	for (let i = TIMES2; i < TIMES3; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time3 = performance.now();
	for (let i = TIMES3; i < TIMES4; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time4 = performance.now();
	
	const mem = memoryUsage(startMem);
	if (true)         console.log(`${getHumanTime(time0 - startTime, 1, 1)} / ${getHumanTime(time1 - time0, TIMES1)} / ${getHumanTime(time2 - time0, TIMES2)} / ${getHumanTime(time3 - time0, TIMES3)} / ${getHumanTime(time4 - time0, TIMES4)}   ${ans}   ${ansLen}`);
	if (canMesureMem) console.log(`rss: ${getHumanMem(mem.rss)}, heapTotal: ${getHumanMem(mem.heapTotal)}, heapUsed: ${getHumanMem(mem.heapUsed)}`);
}, 1);



//=== Functions ===



function memoryUsage(old) {
	gc();
	const mem = process.memoryUsage();
	if (old) {
		for (let key in mem) {
			mem[key] -= old[key];
		}
	}
	return mem;
}

function getHumanMem(bytes) {
	return (bytes / 1048576).toFixed(1) + 'M';
}

function getHumanTime(time, times, pres = 3) {
	return (time / times).toFixed(pres) + ' ms';
}
