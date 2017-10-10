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



let fs;



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
	return printErrorAndExit('Usage: node bench PATH');
}

gc();
setTimeout(startTest, 1, PATH, false);



function startTest(path, alreadyConvertedToJs) {
	const startMem = memoryUsage();
	const startTime = performance.now();
	
	const FindProxyForURL = requireScript(path);
	if (typeof FindProxyForURL !== 'function') {
		return convertToScript_andRestartTest(path, alreadyConvertedToJs);
	}
	if (alreadyConvertedToJs) {
		fs.unlink(path, e => e && console.log('Warning: cannot delete temp file: ' + path));
	}
	
	let ans = FindProxyForURL('http://a.example.com/', `${HOST_PREFIX}.com`);
	let ansLen = ans.length;
	const time0 = performance.now();
	
	for (let i = 0;      i < TIMES1; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time1 = performance.now();
	for (let i = TIMES1; i < TIMES2; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time2 = performance.now();
	for (let i = TIMES2; i < TIMES3; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time3 = performance.now();
	for (let i = TIMES3; i < TIMES4; i++)  { ans = FindProxyForURL('http://a.example1.com/', `${HOST_PREFIX}${i}.com`);   ansLen += ans.length; }   const time4 = performance.now();
	
	const mem = memoryUsage(startMem);
	console.log(`
		Results:
		
		Parsing and first launch:                ${getHumanTime(time0 - startTime, 1, 1)}
		${TIMES1.toString().padEnd(5)} launches (excluding first launch): ${getHumanTime(time1 - time0, TIMES1)}
		${TIMES2.toString().padEnd(5)} launches (excluding first launch): ${getHumanTime(time2 - time0, TIMES2)}
		${TIMES3.toString().padEnd(5)} launches (excluding first launch): ${getHumanTime(time3 - time0, TIMES3)}
		${TIMES4.toString().padEnd(5)} launches (excluding first launch): ${getHumanTime(time4 - time0, TIMES4)}
	`.trim().replace(/\t+/g, ''));
	
	console.log(`\nShort format: ${getHumanTime(time0 - startTime, 1, 1)} / ${getHumanTime(time1 - time0, TIMES1)} / ${getHumanTime(time2 - time0, TIMES2)} / ${getHumanTime(time3 - time0, TIMES3)} / ${getHumanTime(time4 - time0, TIMES4)}   (ans = ${ans}, ansLen = ${ansLen})`);
	if (canMesureMem) {
		console.log(`rss: ${getHumanMem(mem.rss)}, heapTotal: ${getHumanMem(mem.heapTotal)}, heapUsed: ${getHumanMem(mem.heapUsed)}`);
	}else{
		console.log('Memory is not measured. Use "node --expose-gc bench" to measure memory');
	}
}



function requireScript(path) {
	try {
		return require('./' + path);
	} catch(e) {
		try {
			require('fs').readFileSync(path);
		} catch(e) {
			try {
				require('fs').readFileSync(path + '.js');
			} catch(e) {
				return printErrorAndExit('Cannot read ' + path + ' file. File does not exist or you have no permissions.');
			}
		}
		return printErrorAndExit('Cannot use ' + path + ' file because it contains errors.');
	}
}



function convertToScript_andRestartTest(path, alreadyConvertedToJs) {
	if (alreadyConvertedToJs) {
		return printErrorAndExit('Cannot use js-version of file. Try to add "module.exports = FindProxyForURL;" to the end of the file.');
	}
	fs = require('fs');
	
	let s;
	try {
		s = fs.readFileSync(path).toString();
	} catch(e) {
		return printErrorAndExit('Cannot read ' + path + ' file. File does not exist or you have no permissions.');
	}
	
	const path_tmp = path + '.vitaliylag_genPAC_bench.' + Date.now() + '.tmp';
	try {
		fs.writeFileSync(path_tmp, s + ';\n\n\nmodule.exports = FindProxyForURL;\n');
	} catch(e) {
		return printErrorAndExit('Cannot write temp file. Try to add "module.exports = FindProxyForURL;" to the end of the testing file.');
	}
	
	gc();
	setTimeout(startTest, 1, path_tmp, true);
}



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

function printErrorAndExit(...args) {
	console.log(...args);
	process.exit(0);
}
