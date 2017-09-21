# Running
`node gen_array`<br>
`node gen_array --help`<br>
`node gen_binSearch_strings_good`<br>



# Description
This scripts generate PAC file from hosts and ips files. All specified hosts and ips will be
proxied, all other hosts and ips will not be proxied.

Scripts support:
- Skipping the same enries
- Dropping "*." ("good" versions of scripts always check subdomains, other scripts never do that)
- Dropping start and end dots
- Dropping last dot in FindProxyForURL

Scripts do not support:
- Converting non-unicode characters
- Using URLs as input



# Difference between scripts
There is few scripts generating PAC files. Resulting PAC files do the same things but in difference
ways so they have different performance. You can choose generator that makes PAC file with best
performance.

- `gen_array.js`                  just loop over array
- `gen_array2.js`                 the same but without functions and breaking loops
- `gen_globalObject.js`           using global object as hashmap
- `gen_binSearch_array.js`        bin-search over array
- `gen_binSearch_strings.js`      bin-search over string
- `gen_binSearch_strings_good.js` the same but checks subdomains. All subdomains of every host specified 
                                  in hosts will be proxied. For optimizations:
  1. Top-level domain is not checked because it is unlikely that some
                                   top-level zone will be in the list. If you add "com" or "org" entry
                                   into hosts file, "*.com" and "*.org" will not be proxied. But if
                                   you add "example.com", "*.example.com" will be proxied.
  2. Level number is limited by 5. If some hosts have more than 5
                                   levels, other levels will be dropped, so all subdomains will be
                                   proxied. Example: 7.6.5.4.3.example.com will be saved as
                                   5.4.3.example.com so "*.5.4.3.example.com" will be proxied.

Actually "gen_binSearch_strings_good.js" generator is recommended.
