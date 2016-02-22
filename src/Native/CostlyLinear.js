

/** @license
Jmat.js

Copyright (c) 2011-2016, Lode Vandevenne
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// REQUIRES: no dependencies, most basic file of jmat.js.

/*
Jmat.Real: real math operating on plain JS numbers. Similar to JS's Math library except with more functions and algorithms.

Aliased as simply "Real" by jmat.js - disable that if it causes name clashes

Overview of some functionality:
-most standard Math functions are also copied in here
-polyfill for functions of higher versions of JavaScript: Real.log2, Real.log10, Real.clz32, ...
-mod and remainder: Real.mod, Real.rem, Real.wrap, Real.clamp
-special functions. Real.gamma, Real.erf, Real.erfc, Real.lambertw, ...
-primes and factors: Real.isPrime, Real.eratosthenes, Real.factorize, Real.nextPrime, Real.previousPrime, Real.nearestPrime, Real.eulerTotient, Real.gcd, Real.lcm
-date and time: Real.isLeapYear, Real.dayOfWeek,
*/

/** @constructor
Namespace for all of Jmat. Defined in jmat_real.js as this is the first js file that everything else depends on.
*/
function Jmat() {
  // Empty, this is a namespace, no need to ever call this
}

/** @constructor
namespace for real functions
*/
Jmat.Real = function() {
};

// cast all known numeric types to JS number
Jmat.Real.cast = function(v) {
  if(v && v.re != undefined) return v.re;
  if(v == undefined) return 0;
  return v;
};

// cast all known numeric types to JS number, but only if real (so complex/imag gives NaN)
Jmat.Real.caststrict = function(v) {
  if(v && v.re != undefined) return v.im == 0 ? v.re : NaN;
  if(v == undefined) return 0;
  return v;
};

Jmat.Real.SQRT2 = Math.sqrt(2);
Jmat.Real.SQRTPI = Math.sqrt(Math.PI); // gamma(0.5)
Jmat.Real.EM = 0.57721566490153286060; // Euler-Mascheroni constant
Jmat.Real.APERY = 1.2020569; // Apery's constant, zeta(3)
Jmat.Real.BIGGESTJSINT = 9007199254740992; // largest number that JS (float64) can represent as integer: 2^53, 0x20000000000000, 9007199254740992
Jmat.Real.BIGGESTJSPRIME = 9007199254740881; // largest prime number that JS (float64) can represent as integer, that is, the biggest prime smaller than Jmat.Real.BIGGESTJSINT.

////////////////////////////////////////////////////////////////////////////////
// Categories
////////////////////////////////////////////////////////////////////////////////

Jmat.Real.isInt = function(x) {
  return x == Math.floor(x);
};

Jmat.Real.isPositiveInt = function(x) {
  return x == Math.floor(x) && x > 0;
};

Jmat.Real.isNegativeInt = function(x) {
  return x == Math.floor(x) && x < 0;
};

Jmat.Real.isPositiveIntOrZero = function(x) {
  return x == Math.floor(x) && x >= 0;
};

Jmat.Real.isNegativeIntOrZero = function(x) {
  return x == Math.floor(x) && x <= 0;
};

// x is odd integer
Jmat.Real.isOdd = function(x) {
  return Math.abs(x % 2) == 1; //works for negative x too
};

// x is even integer
Jmat.Real.isEven = function(x) {
  return x % 2 == 0; //works for negative x too
};

// x is power of two
Jmat.Real.isPOT = function(x) {
  return x != 0 && (x & (x - 1)) == 0;
};

//isnanorinf isinfornan
Jmat.Real.isInfOrNaN = function(x) {
  return x == Infinity || x == -Infinity || isNaN(x);
};

////////////////////////////////////////////////////////////////////////////////

// dist, cheb and manhattan all return regular real JS numbers for all types. In some types they are all the same, but not for e.g. Complex or Matrix.
// Euclidean distance
Jmat.Real.dist = function(a, b) {
  if(a == b) return 0; // this is to avoid subtracting Infinity - Infinity
  return Math.abs(a - b);
};
//Chebyshev distance
Jmat.Real.cheb = function(a, b) {
  return Jmat.Real.dist(a, b);
};
//Manhattan distance
Jmat.Real.manhattan = function(a, b) {
  return Jmat.Real.dist(a, b);
};

// Modulo operation. Different than JS's % operator in case of negative operands.
// Result has the sign of the divisor b.
// Works for non-integers too, similar to "fmod" in C (in case of positive arguments).
// Compare with rem: Different programs and programming languages use different
// names for this, there is no convention which one has which sign, though in
// languages with both a "mod" and "rem", the convention adopted here is most
// popular. See the table at https://en.wikipedia.org/wiki/Modulo_operation.
//
// mod in terms of rem (%). The table below compares the two operators.
// x    :   -4 -3 -2 -1  0  1  2  3  4
// x mod  3:    2  0  1  2  0  1  2  0  1
// x mod -3:   -1  0 -2 -1  0 -2 -1  0 -2
// x rem  3:   -1  0 -2 -1  0  1  2  0  1
// x rem -3:   -1  0 -2 -1  0  1  2  0  1
// The sign of mod is that of b, while that of rem is that of a.
//
// "mod" is the one that is mathematically more useful, while "rem" is the one
// matching the "%" operator in most programming languages.
// mod corresponds to floored division, while rem corresponds to truncated division.
Jmat.Real.mod = function(a, b) {
  return a - Math.floor(a / b) * b; // alternative: (b + (a % b)) % b
};

// Remainder. This is the same as the % operator.
// Result has the sign of the dividend a.
// Compare with Jmat.Real.mod, which is different and contains more description about the difference between rem and mod.
Jmat.Real.rem = function(a, b) {
  return a % b;
};

// to is not included in the range
Jmat.Real.wrap = function(x, from, to) {
  if(from == to) return from;
  var m0 = Math.min(from, to);
  var m1 = Math.max(from, to);
  return m0 + Jmat.Real.mod(x - m0, m1 - m0);
};

// to is included in the range
Jmat.Real.clamp = function(x, from, to) {
  var m0 = Math.min(from, to);
  var m1 = Math.max(from, to);
  return Math.max(m0, Math.min(m1, x));
};

// floored integer division. Note that this is distinct from the truncated integer division used on many platforms.
Jmat.Real.idiv = function(a, b) {
  return Math.floor(a / b);
};

//Inspired by Wikipedia, Lanczos approximation, precision is around 15 decimal places
Jmat.Real.gamma = function(z) {
  // Return immediately for some common values, to avoid filling the cache with those
  if(z == Infinity) return Infinity;
  if(Jmat.Real.useFactorialLoop_(z - 1)) {
    return Jmat.Real.factorial(z - 1); //that one uses memoization
  }
  if(z == 0.5) return Jmat.Real.SQRTPI;

  // The internal function that doesn't do internal checks
  var gamma_ = function(z) {
    if(z <= 0 && z == Math.round(z)) return /*NaN*/ Infinity; //gamma not defined for negative integers. TODO: this should be "undirected" infinity

    // reflection formula
    if(z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * gamma_(1 - z));
    }

    var g = 7;
    var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    z -= 1;
    var x = p[0];
    for(var i = 1; i < g + 2; i++) {
      x += p[i] / (z + i);
    }
    var t = z + g + 0.5;
    return Math.sqrt(Math.PI * 2) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  };

  return gamma_(z);
};

Jmat.Real.factorialmem_ = [1]; //memoization for factorial of small integers

Jmat.Real.useFactorialLoop_ = function(x) {
  return Jmat.Real.isPositiveIntOrZero(x) && x < 200;
};

Jmat.Real.factorial = function(a) {
  if(!Jmat.Real.useFactorialLoop_(a)) {
    return Jmat.Real.gamma(a + 1);
  }

  if(Jmat.Real.factorialmem_[a]) return Jmat.Real.factorialmem_[a];

  var result = Jmat.Real.factorialmem_[Jmat.Real.factorialmem_.length - 1];
  for(var i = Jmat.Real.factorialmem_.length; i <= a; i++) {
    result *= i;
    Jmat.Real.factorialmem_[i] = result;
  }
  return result;
};

// checks whether a is a perfect power of b, e.g. 27 is a power of 3, but 10 is not a power of 5. Negative values are not supported.
// returns 0 if not power of (or the power is 0 - that is trivial if a is 1)
// returns the positive power otherwise
Jmat.Real.isPowerOf = function(a, b) {
  var R = Jmat.Real;
  if(a == b) return 1;
  if(b <= 0) return 0; // false
  if(a <= 0) return 0; // false
  if(a == 1) return 0; // true but it's 0
  if(b > a) return 0; // false
  if(R.isPOT(a) && R.isPOT(b)) {
    var la = R.ilog2(a);
    var lb = R.ilog2(b);
    if(la % lb == 0) return la / lb;
    return 0;
  }
  if(R.isPOT(a) != R.isPOT(b)) return 0; // false
  if(R.isEven(a) != R.isEven(b)) return 0; // false (or a is 1)
  var c = b;
  // Binary search with powers.
  var bs = [];
  var bb = b;
  var result = 1;
  while(c < a) {
    bs.push(bb);
    c *= bb;
    result *= 2;
    if(c == a) return result;
    bb = bb * bb;
  }
  if(c == Infinity) return 0;
  while(bs.length > 0) {
    var p = bs.pop();
    if(c > a) {
      c /= p;
      result -= (1 << bs.length);
    }
    else {
      c *= p;
      result += (1 << bs.length);
    }
    if(c == a) return result;
  }
  return 0;
};

Jmat.Real.firstPrimes_ = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

// Initial set up shared by several of the prime test functions.
// Returns 0 if not prime, 1 if prime, NaN if problem, -1 if unknown by this function
Jmat.Real.isPrimeInit_ = function(n) {
  if(n == Infinity || n != n) return NaN;
  if(n != Math.round(n)) return 0;
  if(n < 2) return 0;
  if(n > Jmat.Real.BIGGESTJSINT) return NaN; //too large for the floating point's integer precision, result will not make sense
  for(var i = 0; i < Jmat.Real.firstPrimes_.length; i++) {
    if(n == Jmat.Real.firstPrimes_[i]) return 1;
    if(n % Jmat.Real.firstPrimes_[i] == 0) return 0;
  }
  return -1;
};

//Returns 1 if prime, 0 if not prime, NaN if error. Naive slow algorithm. However, faster than miller rabin for n < 1500000
Jmat.Real.isPrimeSlow_ = function(n) {
  // Ensures the number is odd and integer in supported range, tested against first known primes
  var init = Jmat.Real.isPrimeInit_(n);
  if(init != -1) return init;

  var p = Jmat.Real.firstPrimes_[Jmat.Real.firstPrimes_.length - 1];
  var s = Math.ceil(Math.sqrt(n)) + 6;
  p = Math.floor(p / 6) * 6;
  while(p < s) {
    if(n % (p - 1) == 0 || n % (p + 1) == 0) return 0;
    p += 6;
  }
  return 1;
};

//Deterministic Miller-Rabin primality test
//Not probabilistic, but relies on the generalized Riemann hypothesis
//Returns 1 if prime, 0 if not prime, NaN if error.
//Supposedly fast, but only faster than the naive method for n > 1500000
Jmat.Real.isPrimeMillerRabin_ = function(n) {
  // Ensures the number is odd and integer in supported range, tested against first known primes
  var init = Jmat.Real.isPrimeInit_(n);
  if(init != -1) return init;

  // Miller-Rabin test
  var base;
  if(n < 1373653) base = [2, 3];
  else if(n < 9080191) base = [31, 73];
  else if(n < 4759123141) base = [2, 7, 61];
  else if(n < 1122004669633) base = [2, 13, 23, 1662803];
  else if(n < 2152302898747) base = [2, 3, 5, 7, 11];
  else if(n < 3474749660383) base = [2, 3, 5, 7, 11, 13];
  else if(n < 341550071728321) base = [2, 3, 5, 7, 11, 13, 17];
  else if(n < 3770579582154547) base = [2, 2570940, 880937, 610386380, 4130785767];
  else base = [2, 325, 9375, 28178, 450775, 9780504, 1795265022]; //valid up to >2^64

  var d = Math.floor(n / 2);
  var s = 1;
  while(!(d & 1)) {
    d = Math.floor(d / 2);
    ++s;
  }

  // returns (a + b) % c, taking overflow into account (in JS, overflow means reaching a part in the floating point representation where it can no longer distinguish 1)
  var modadd = function(a, b, c) {
    if (a + b < Jmat.Real.BIGGESTJSINT) return (a + b) % c;
    if(a + b > c) {
      return (a - c + b) % c;
    }
    // This assumes that c < 4503599627370496 or a + b doesn't overflow
    return ((a % c) + (b % c)) % c;
  };

  // returns (a * b) % c, taking overflow into account
  var modmul = function(a, b, c) {
    if(a * b < Jmat.Real.BIGGESTJSINT) return (a * b) % c;
    var x = 0;
    var y = a % c;
    while(b > 0) {
      if(b & 1) x = modadd(x, y, c);
      y = modadd(y, y, c);
      b = Math.floor(b / 2);
    }
    return x % c;
  };

  // returns (a to the n) % mod, taking overflow into account
  var modpow = function(a, n, mod) {
    var result = 1;
    while(n > 0) {
      if(n & 1) result = modmul(result, a, mod);//(result * a) % mod;
      a = modmul(a, a, mod);//(a * a) % mod;
      n = Math.floor(n / 2);
    }
    return result;
  };

  var witness = function(n, s, d, a) {
    var x = modpow(a, d, n);
    while(s) {
      var y = modmul(x, x, n); //(x * x) % n;
      if(y == 1 && x != 1 && x != n - 1) return false;
      x = y;
      s--;
    }
    return y == 1;
  };

  for(var i = 0; i < base.length; i++) {
    if(!witness(n, s, d, base[i])) return 0;
  }
  return 1;
};
/*
test in console for the above function:
function benchfun(n) {
  var ra = 0; var ta0 = new Date().getTime(); for(var i = 0; i < n; i++) ra += Jmat.Real.isPrimeMillerRabin_(i); var ta1 = new Date().getTime();
  var rb = 0; var tb0 = new Date().getTime(); for(var i = 0; i < n; i++) rb += Jmat.Real.isPrimeSlow_(i); var tb1 = new Date().getTime();
  var rc = 0; var tc0 = new Date().getTime(); for(var i = 0; i < n; i++) rc += Jmat.Real.isPrime(i); var tc1 = new Date().getTime();
  console.log('fast: ' + (ta1 - ta0) + ' slow: ' + (tb1 - tb0) + ' both: ' + (tc1 - tc0) + ' test: ' + ra + ' = ' + rb + ' = ' + rc);
};
benchfun(100000);
--> it will report that slow if faster than miller rabin. That's because miller rabin is only faster for very large numbers. E.g. here you can see that miller rabin is faster:
Jmat.Real.isPrimeSlow_(4444280714420857)
Jmat.Real.isPrimeMillerRabin_(4444280714420857)


function testfun(n) {
  for(var i = 0; i < n; i++) {
    var a = Jmat.Real.isPrimeMillerRabin_(i);
    var b = Jmat.Real.isPrimeSlow_(i);
    if(a != b) console.log('error: ' + i + ' ' + a + ' ' + b);
  }
  console.log('ok: ' + n);
};
testfun(100000);

Nice primes to test:
3770579582154547 --> NOT prime, but above this boundary, last "base" for miller rabin test is used
9007199254740992 --> NOT prime, but highest integer number that JavaScript supports
9007199254740881: just small enough for JS! ==> overflow with sum, does not work
4444280714420857: largest for half JS bits
311111111111113: for third last base
344555666677777: for second last base
*/

//Returns 1 if prime, 0 if not prime, NaN if error.
Jmat.Real.isPrime = function(n) {
  // below that, the "slow" method is faster. For higher values, Miller Rabin becomes more and more significantly faster.
  return (n < 1500000) ? Jmat.Real.isPrimeSlow_(n) : Jmat.Real.isPrimeMillerRabin_(n);
};

// Sieve of Eratosthenes: returns array of all the primes up to n.
Jmat.Real.eratosthenes = function(n) {
  if(n < 2) return [];
  var result = [2];
  var a = [];
  var s = Math.floor(Math.sqrt(n));

  var num = Math.ceil(n / 2);
  // a[i] represents odd numbers: a[0] represents 1, a[1] represents 3, a[n] represents n*2 + 1, m is represented by a[floor(m / 2)]
  for(var i = 0; i < num; i++) a[i] = true;
  for(var m = 3; m <= s; m += 2) {
    var i = Math.floor(m / 2);
    if(!a[i]) continue;
    for(var j = i + m; j < num; j += m) a[j] = false;
  }

  for(var i = 1; i <= n; i++) {
    if(a[i]) result.push((i * 2) + 1);
  }
  return result;
};

//for factorize
Jmat.Real.smallestPrimeFactor = function(x) {
  if(x == Infinity || x != x) return NaN;
  if(x != Math.round(x)) return NaN;
  if(x < 1) return NaN;
  if(x > Jmat.Real.BIGGESTJSINT) return NaN; //too large for the floating point's integer precision, result will not make sense
  if(x == 1) return 1;
  for(var i = 0; i < Jmat.Real.firstPrimes_.length; i++) {
    if(x == Jmat.Real.firstPrimes_[i]) return x;
    if(x % Jmat.Real.firstPrimes_[i] == 0) return Jmat.Real.firstPrimes_[i];
  }
  var p = Jmat.Real.firstPrimes_[Jmat.Real.firstPrimes_.length - 1];
  var s = Math.ceil(Math.sqrt(x));
  p = Math.floor(p / 6) * 6;
  while(p < s + 5) {
    if(x % (p - 1) == 0) return p - 1;
    if(x % (p + 1) == 0) return p + 1;
    p += 6;
  }
  return x;
};

//factorize: returns prime factors as array of real integers, sorted from smallest to largest. x must be integer.
Jmat.Real.factorize = function(x) {
  if(x > Jmat.Real.BIGGESTJSINT) return undefined; //too large for the floating point's integer precision, will cause crash
  var x = Math.round(x);
  var result = [];
  if(x < 0) {
    x = -x;
    result.push(-1);
  }
  if(x <= 2) {
    if(result.length == 0 || x != 1) result.push(x); // return [0] if x is 0, [1] if x is 1
    return result;
  }
  for(;;) {
    if(x < 1) break;
    var y = Jmat.Real.smallestPrimeFactor(x);
    result.push(y);
    if(x == y) break;
    x = Math.round(x / y);
  }
  return result;
};


Jmat.Real.primeCount = function(value) {
  var primesN = [ 0, 2, 3, 5, 7, 11, 13, 17 ];
  // Nth prime (1-indexed: n=1 gives 2)
  var p = function(n) {
    if(n < primesN.length) return primesN[n];
    var i = primesN[primesN.length - 1] + 2;
    var count = primesN.length - 1;
    for(;;) {
      if(Jmat.Real.isPrime(i)) {
        primesN.push(i);
        count++;
        if(count == n) return i;
      }
      i += 2;
    }
  };

  var phiCache = {};
  // number of natural numbers smaller than m which are not divisible by
  // the first n primes
  var phi = function(m, n) {
    if(n == 0) return Math.floor(m);
    else if(n == 1) return Math.floor((m + 1) / 2);
    else {
      if(phiCache[m] && phiCache[m][n] != undefined) return phiCache[m][n];
      var result = phi(m, n - 1) - phi(Math.floor(m / p(n)), n - 1);
      if(!phiCache[m]) phiCache[m] = {};
      phiCache[m][n] = result;
      return result;
    }
  };

  var piCache = {};
  var pi = function(v) {
    if(v > 1000000000) return NaN; //it starts giving rounding errors or so somewhere before 1050000000
    if(v < 2) return 0;
    if(v < 3) return 1;
    if(v < 5) return 2;
    var n = Math.floor(v);
    if(piCache[n]) return piCache[n];
    var a = Math.floor(pi(Math.pow(v, 1.0 / 4.0)));
    var b = Math.floor(pi(Math.sqrt(v)));
    var c = Math.floor(pi(Math.pow(v, 1.0 / 3.0)));
    var sum = phi(n, a) + Math.floor((b + a - 2) * (b - a + 1) / 2);
    for(var i = a + 1; i <= b; i++) {
      var w = n / p(i); //NOT integer division!
      sum -= pi(w);
      if(i <= c) {
        var bi = pi(Math.sqrt(w));
        for(var j = i; j <= bi; j++) {
          sum -= pi(w / p(j)) - j + 1;
        }
      }
    }
    piCache[n] = sum;
    return sum;
  };

  return pi(value);
};

Jmat.Real.nearestPrime = function(value) {
  var x = Math.round(value);
  // Anything below 6 does not work with the calculations below.
  if(x < 7) {
    if(x <= 2) return 2;
    if(x <= 4) return 3;
    return 5;
  }
  if(x == Infinity || x != x) return NaN;
  if(x >= 9007199254740881) return NaN; //largest supported prime in floating point precision, after this result is not correct because after Jmat.Real.BIGGESTJSINT isPrime gives NaN

  if(Jmat.Real.isPrime(x)) return x;
  var d = x % 6;
  var e = 6 - d;
  var i = 0;
  var result = 0;
  for(;;) {
    if(Jmat.Real.isPrime(x - i - d + 1)) result = x - i - d + 1;
    else if(Jmat.Real.isPrime(x - i - d - 1)) result = x - i - d - 1;

    if((!result || (x - result) > (i + e - 1)) && Jmat.Real.isPrime(x + i + e - 1)) result = x + i + e - 1;
    else if((!result || (x - result) > (i + e + 1)) && Jmat.Real.isPrime(x + i + e + 1)) result = x + i + e + 1;

    if(result) return result;

    i += 6;
  }
};

Jmat.Real.nextPrime = function(value) {
  var x = Math.floor(value);
  if(x < 2) return 2;
  if(x < 3) return 3;
  if(x == Infinity || x != x) return NaN;
  if(x >= 9007199254740881) return NaN; //largest supported prime in floating point precision, after this will infinite loop because after Jmat.Real.BIGGESTJSINT isPrime gives NaN

  var m = x % 6;
  var step = 2;
  if(m == 0 || m == 5) {
    x += (m == 0 ? 1 : 2);
    step = 4;
  } else {
    x += (5 - m);
  }
  for(;;) {
    if(Jmat.Real.isPrime(x)) return x;
    x += step;
    step ^= 6; //swap step between 2 and 4
  }
};

Jmat.Real.previousPrime = function(value) {
  var x = Math.ceil(value);
  if(x <= 2) return NaN; // there is no lower prime
  if(x <= 3) return 2;
  if(x <= 5) return 3;
  if(x <= 7) return 5;
  if(x == Infinity || x != x) return NaN;
  if(x > Jmat.Real.BIGGESTJSINT) return NaN; //too large for the floating point's integer precision, result will not make sense

  var m = x % 6;
  var step = 2;
  if(m == 0 || m == 1) {
    x -= (m + 1);
    step = 4;
  } else {
    x -= (m - 1);
  }
  for(;;) {
    if(Jmat.Real.isPrime(x)) return x;
    x -= step;
    step ^= 6; //swap step between 2 and 4
  }
};

Jmat.Real.eulerTotient = function(value) {
  if(value <= 0) return NaN;
  var n = Math.floor(value);
  var f = Jmat.Real.factorize(n);
  var prev = -1;
  var result = n;
  for(var i = 0; i < f.length; i++) {
    if(prev == f[i]) continue; //must be unique factors
    if(f[i] == 1) break;
    prev = f[i];
    result *= (1 - (1 / f[i]));
  }
  return result;
};

// The first integer binomials, allows fast calculation of those by just looking up in the array, e.g. binomial(5, 8) = Jmat.Complex.pascal_triangle_cache_[5][8]
// some rows area pre-filled to start it off (just pre-filling the first one would be sufficient normally, the rest is just for the shows)
Jmat.Real.pascal_triangle_cache_ = [
    [1],
    [1, 1],
    [1, 2, 1],
    [1, 3, 3, 1],
    [1, 4, 6, 4, 1],
    [1, 5, 10, 10, 5, 1],
    [1, 6, 15, 20, 15, 6, 1],
    [1, 7, 21, 35, 35, 21, 7, 1]
];

// A helper function for integer binomial. Uses cached pascal triangle, so is guaranteed to be O(1) once the cache is filled up.
// Only works for integers, and only works for n < 180. After that, the double precision numbers no longer recognise every integer number.
Jmat.Real.pascal_triangle = function(n, p) {
  if(n < 0 || p < 0 || n < p) return NaN;
  if(n > 180) return NaN; //triangle values get too big for integers in double precision floating point
  //fill up cache if needed
  var t = Jmat.Real.pascal_triangle_cache_;
  while(t.length <= n) {
    var l = t.length; //the 'n' of the new row
    var l2 = l + 1; // number of elements of this new row
    t[l] = [];
    for(var i = 0; i < l2; i++) {
      t[l][i] = (i == 0 || i == l2 - 1) ? 1 : (t[l-1][i-1] + t[l-1][i]);
    }
  }
  return t[n][p];
};

//greatest common divisor
Jmat.Real.gcd = function(x, y) {
  if(!Jmat.Real.isInt(x) || !Jmat.Real.isInt(y)) return NaN; //prevents infinite loop if both x and y are NaN. Also, reals are not supported here.
  if(Math.abs(x) > Jmat.Real.BIGGESTJSINT || Math.abs(y) > Jmat.Real.BIGGESTJSINT) return NaN; // does not work above JS integer precision
 //Euclid's algorithm
 for(;;) {
   if(y == 0) return Math.abs(x); //if x or y are negative, the result is still positive by the definition
   var z = Jmat.Real.mod(x, y);
   x = y;
   y = z;
 }
};

//least common multiple
Jmat.Real.lcm = function(x, y) {
 return Math.abs(x * y) / Jmat.Real.gcd(x, y);
};

// Decomposes fraction (aka rational approximation): returns two integers [numerator, denominator] such that n/d = a.
// Very slow, too slow for inner loop of running programs (integrate or complex plot)...
// max = max value for denominator
// E.g. Jmat.Real.decompose(Math.PI, 100) gives [22, 7], because 22/7 approximates pi.
Jmat.Real.decompose = function(x, max) {
  if(!max) max = 100000;
  var neg = (x < 0);
  if(neg) x = -x;
  var f = Math.floor(x);
  var y = x - f;

  if(y == 0) return [x, 1]; //otherwise the loop will run max times for nothing, very inefficient

  var result;

  var a = 0;
  var b = 1;
  var c = 1;
  var d = 1;

  //mediant of two fractions a/c and b/d is defined as (a+b)/(c+d)
  while (b <= max && d <= max) {
    var mediant = (a + c) / (b + d);
    if(y == mediant) {
      if(b + d <= max) result = [a + c, b + d];
      else if(d > b) result = [c, d];
      else result = [a, b];
      break;
    } else if(y > mediant) {
      a = a + c;
      b = b + d;
    } else {
      c = a + c;
      d = b + d;
    }
  }
  if (!result) {
    if (b > max) result = [c, d];
    else result = [a, b];
  }

  result[0] += f * result[1];
  if(neg) result[0] = -result[0];

  return result;
};

// Hybrid between decompose and decomposeFast
Jmat.Real.decomposeSemiFast = function(x, max) {
  var maxslow = 1000;
  if(max < maxslow) {
    return Jmat.Real.decompose(x, max);
  } else {
    var a = Jmat.Real.decompose(x, maxslow);
    var ax = a[0] / a[1];
    if(ax == x) return a;
    var b = Jmat.Real.decomposeFast(x, maxslow);
    var bx = b[0] / b[1];
    return (Math.abs(x - ax) < Math.abs(x - bx)) ? a : b;
  }
};

// Decomposes fraction (aka rational approximation): returns two integers [numerator, denominator] such that n/d = a.
// max = max value for denominator
// A lot faster, but less nice than Jmat.Real.decompose (e.g. returns 83333/10000 instead of 1/12), and with high preference for decimal denominators. TODO: other bases than base 10
Jmat.Real.decomposeFast = function(x, max) {
  if(!max) max = 100000;
  var max1 = max - 1;

  if(x <= max1 && x >= -max1 && (x < -1.0 / max1 || x > 1.0 / max1)) {
    var neg = (x < 0);
    if(neg) x = -x;
    var z = Math.floor(x);
    var n = x - z;
    var d = max;
    n = Math.floor(n * d);
    var g = Jmat.Real.gcd(n, d);
    d /= g;
    n /= g;
    n += z * d;
    if(neg) n = -n;
    // n = numerator, d = denominator
    return [n, d];
  }
  return [x, 1];
};

Jmat.Real.near = function(x, y, epsilon) {
  // works also for infinities
  return x >= y - epsilon && x <= y + epsilon;
};

/*
Precision must be near 0 but slightly larger, e.g. 0.001 for 3 digits of precision, 1e-5 for 5 digits, ...
That many digits must match, starting from the first non-zero digit.
That means, if one value is zero and the other is not, no matter how close to zero the other is, this function will always return false.
It also always returns false if the signs differ.
Examples:
Jmat.Real.relnear(1.25e-300, 1.26e-300, 1e-2) --> true
Jmat.Real.relnear(1.25e-300, 1.26e-300, 1e-3) --> false
*/
Jmat.Real.relnear = function(x, y, precision) {
  if(x == y) return true;
  if(x == 0 || y == 0) return false; // case were both are 0 already handled with previous comparison
  if((x < 0) != (y < 0)) return false;
  x = Math.abs(x);
  y = Math.abs(y);
  var d = (x > y) ? (x / y) : (y / x);
  return d < 1 + precision;
};

// Fractional part of x, x - floor(x). NOTE: this variant gives positive results for negative x
Jmat.Real.frac = function(x) {
  return x - Math.floor(x);
};

// Fractional part of x, x - int(x). NOTE: this variant gives negative results for negative x
Jmat.Real.fracn = function(x) {
  return x > 0 ? (x - Math.floor(x)) : -(-x - Math.floor(-x));
};

// Only the principal branch for real values above -1/e
Jmat.Real.lambertw = function(x) {
  if(isNaN(x)) return NaN;
  if(x == Infinity || x == -Infinity) return Infinity;

  if(x >= -1.0 / Math.E && x <= 703) {
    //Newton's method. Only works up to 703
    var wj = x < 10 ? 0 : Math.log(x) - Math.log(Math.log(x)); // Without good starting value, it requires hundreds of iterations rather than just 30.
    var num = Math.max(30, x > 0 ? 10 + Math.floor(x) : 30);
    for(var i = 0; i < num; i++) {
      var ew = Math.exp(wj);
      wj = wj - ((wj * ew - x) / (ew + wj * ew));
    }
    return wj;
  } else if (x > 0) {
    //Since the above method works only up to 703, use some kind of binary search instead (it's a monotonously increasing function at this point)
    // TODO: probably just use Halley's method here instead
    var step = 1;
    var lastDir = 0;
    var result = Math.log(x) - Math.log(Math.log(x)); // good starting value speeds up iterations. E.g. only 76 instead of 292 for 7e100.
    for(;;) {
      if(step == 0 || step * 0.5 == step || result + step == result) return result; //avoid infinite loop
      var v = result * Math.exp(result);
      if(Jmat.Real.near(v, x, 1e-15)) return result;
      if(v > x) {
        result -= step;
        if(lastDir == -1) step *= 0.5;
        lastDir = 1;
      } else {
        result += step;
        if(lastDir == 1) step *= 0.5;
        lastDir = -1;
      }
    }
  }
  return NaN;
};


//arbitrary log: log_y(x)
//warning: base y is second argument
Jmat.Real.logy = function(x, y) {
  return Math.log(x) / Math.log(y);
};

// Returns the number of leading zero bits in the 32-bit binary representation of x
// Gives floor of log2 of x by doing 31 - clz32(x)
// Gives num bits of x by doing 32 - clz32(x)
// Only guaranteed to work for numbers less than 32 bits
Jmat.Real.clz32 = Math['clz32'] || function(x) {
  var result = 0;
  while(x > 0) {
    x = Math.floor(x / 2);
    result++;
  }
  return 32 - result;
}

//NOTE: floating point version. For integer log2 use ilog2,
//because e.g. on 8 this gives 2.9999999999999996 (official Math.log2 too)
Jmat.Real.log2 = Math.log2 || function(x) {
  return Math.log(x) / Math.LN2;
};

// Integer log2: the floor of log2
Jmat.Real.ilog2 = function(x) {
  if(x <= 0) return NaN;
  if(x < 2147483648) return 31 - Jmat.Real.clz32(x);
  return Math.floor(Jmat.Real.log2(Math.floor(x) + 0.5));
};

Jmat.Real.getNumBits = function(x) {
  return Jmat.Real.ilog2(Math.abs(x)) + 1;
};

Jmat.Real.log10 = Math.log10 || function(x) {
  return Math.log(x) / Math.LN10;
};

Jmat.Real.root = function(x, y) {
  return Math.pow(x, 1 / y);
};

////////////////////////////////////////////////////////////////////////////////

// Faddeeva function: w(z) = exp(-z^2)*erfc(-iz). Also known as Faddeyeva or w(z) (not to be confused with LambertW)
// Returns complex result as an array [re, im], for complex input z = i*x + y. The result is real for pure imaginary input (arbitrary complex otherwise)
// Note that Jmat.Real does not depend on Jmat.Complex so does not use that datatype to represent the complex number.
// This complex function is used in Jmat.Real because some real erf related functions use imaginary numbers, and, this function gives very good accuracy for everything erf related.
// Based on paper "More Efficient Computation of the Complex Error Function, G. P. M. POPPE and C. M. J. WIJERS "
Jmat.Real.faddeeva = function(x, y) {
  var R = Jmat.Real;
  var invsqrtpi2   = 2 / R.SQRTPI;

  // complex exponentiation exp(x + yi)
  var cexp = function(x, y) {
    var e = Math.exp(x);
    return [e * Math.cos(y), e * Math.sin(y)];
  };

  // complex multiplication (a + bi) * (c + di)
  var cmul = function(a, b, c, d) {
    return [a * c - b * d, a * d + b * c];
  };

  // reciproke of complex number (x + yi)
  var cinv = function(x, y) {
    var d = x * x + y * y;
    return [x / d, -y / d];
  };

  // square of rho, used to determine which algorithm to use and what tweaking
  // parameters inside the algorithm. All magic numbers related to rho are as
  // suggested in the paper.
  var rho2 = (x / 6.3 * x / 6.3) + (y / 4.4 * y / 4.4);

  // Methods 2 and 3 below require positive imaginary part y, so transform
  // using the transformation w(-x) = 2 * exp(-x*x) - w(x).
  if(y < 0 && rho2 >= 0.292 * 0.292) {
    // For large negative pure imaginary values starting at -26.64, the code
    // starts returning NaN. Return Infinity instead (it is large positive overflow).
    if(x == 0 && y < -26.64) return [Infinity, 0]

    var e = cexp(y * y - x * x, -2 * x * y); // exp(-z*z)
    var f = R.faddeeva(-x, -y);
    return [2 * e[0] - f[0], 2 * e[1] - f[1]];
  }

  var result = [0, 0];

  if(rho2 < 0.292 * 0.292) {
    // Method 1: Power series
    // Based on sum 7.1.5 from Handbook of Mathematical Functions
    // erf(z) = 2/sqrt(pi) * SUM_n=0..oo (-1)^n * z^(2n+1) / (n! * (2n+1))
    // and then w(z) = e^(-z^2) * (1 - erf(iz))
    var s = (1 - 0.85 * y / 4.4) * Math.sqrt(rho2);
    var n = Math.ceil(6 + 72 * s); // ideal number of iterations
    var kk = 1;
    var zz = [y * y - x * x, -2 * x * y]; // -z*z
    var t = [y, -x]; // holds iz^(2k+1)
    for(var k = 0; k < n; k++) {
      if(k > 0) {
        kk *= -k; // (-1)^k * k!
        t = cmul(t[0], t[1], zz[0], zz[1]);
      }
      result[0] += t[0] / (kk * (2 * k + 1));
      result[1] += t[1] / (kk * (2 * k + 1));
    }
    var e = cexp(zz[0], zz[1]); // exp(-z*z)
    result = cmul(e[0], e[1], result[0], result[1]);
    result[0] = e[0] - result[0] * invsqrtpi2;
    result[1] = e[1] - result[1] * invsqrtpi2;
  } else if(rho2 < 1.0) {
    // Method 2: Taylor series
    // The continued fraction is used for derivatives of faddeeva function. More
    // info about the continued fraction is in Method 3.
    // h is the heuristically chosen point at which the taylor series is considered.
    // The derivative of w(z) is w'(z) = -2z*w(z)+2i/sqrt(pi)), but also
    // with w_n(z) defined as exp(-z*z) * i^n * erfc(-iz), the nth derivative
    // of w(z) is equal to (2i)^n * n! * w_n(z), and in the tayler expansion the
    // factorial gets canceled out: w(z) = SUM_0..oo (2h)^n * w_n(z + ih).
    var s = (1 - y / 4.4) * Math.sqrt(1 - rho2);
    var nu = Math.ceil(16 + 26 * s) + 1; // ideal number of iterations for continued fraction
    var n = Math.ceil(7  + 34 * s) + 1; // ideal number of iterations for taylor series
    var h = 1.88 * s;

    // The first iterations only warm up the w_n's with continued fraction
    var w = [0, 0]; // w_n's
    for (var k = nu; k > n; k--) {
      w = cinv(2 * (y + k * w[0] + h), 2 * (k * w[1] - x)); // 0.5/(h - i*z + k*w)
    }
    // The next iterations run the taylor series, while keeping updating the continued fraction
    var hh = Math.pow(h * 2, n - 1);
    for (var k = n; k > 0; k--) {
      w = cinv(2 * (y + k * w[0] + h), 2 * (k * w[1] - x)); // 0.5/(h - i*z + k*w)
      result = cmul(result[0] + hh, result[1], w[0], w[1]); // (result + hh) * w
      hh /= (h * 2);
    }
    result[0] *= invsqrtpi2;
    result[1] *= invsqrtpi2;
  } else {
    // Method 3: Continued fraction
    // The continued fraction is evaluated as r_nu = 0, r_(n-1) = 0.5 / (-iz + (n + 1)r_n), r_0 is the final approximate result
    var nu = Math.ceil(3 + (1442 / (26 * Math.sqrt(rho2) + 77))) + 1; // ideal number of iterations
    for (var k = nu; k > 0; k--) {
      result = cinv(2 * (y + k * result[0]), 2 * (k * result[1] - x)); //  0.5/(-i*z + k*result)
    }
    result[0] *= invsqrtpi2;
    result[1] *= invsqrtpi2;
  }

  if(x == 0) result[1] = 0; // for pure imaginary input, result is pure real. Fix potential numerical problems, and cases of "-0".
  if(y == 0) result[0] = Math.exp(-x * x); // for pure real input, the real part of the output is exactly exp(-x * x). Fix numerical imprecisions when near zero.
  return result;
};

// erfcx(x) = exp(x^2) * erfc(x): the scaled complementary error function
Jmat.Real.erfcx = function(x) {
  return Jmat.Real.faddeeva(0, x)[0]; //erfcx(x) = faddeeva(ix)
};

Jmat.Real.erf = function(x) {
  /*
  For verification, comparing with following 24 digit precision (our function gets about 14 digits correct):
  erf(0.00001) = 0.000011283791670578999349
  erf(0.1) = 0.112462916018284892203275
  erf(0.5) = 0.520499877813046537682746
  erf(1.5) = 0.966105146475310727066976
  erf(2.5) = 0.999593047982555041060435
  erf(3.5) = 0.999999256901627658587254
  erf(4.5) = 0.999999999803383955845711
  erf(5.5) = 0.999999999999992642152082
  erf(6.5) = 0.999999999999999999961578
  erf(3.5i) = 35282.287715171685310157997216i
  erf(3.5+3.5i) = 0.887129271239584272207414 + 0.015026380322129921373706i
  */
  var a = Math.exp(-x * x);
  if (x >= 0) return 1 - a * Jmat.Real.faddeeva(0, x)[0];
  else return a * Jmat.Real.faddeeva(0, -x)[0] - 1;
};

// erfc(x) = 1 - erf(x). This function gives numerically a better result if erf(x) is near 1.
Jmat.Real.erfc = function(x) {
  /*
  For verification, comparing with following 24 digit precision (our function gets about 14 digits correct):
  erfc(0.00001) = 0.999988716208329421000650
  erfc(0.1) = 0.887537083981715107796724
  erfc(0.5) = 0.479500122186953462317253
  erfc(1.5) = 0.033894853524689272933023
  erfc(2.5) = 0.000406952017444958939564
  erfc(3.5) = 7.430983723414127455236837 * 10^-7
  erfc(4.5) = 1.966160441542887476279160 * 10^-10
  erfc(5.5) = 7.357847917974398063068362 * 10^-15
  erfc(6.5) = 3.842148327120647469875804 * 10^-20
  erfc(3.5i) = 1 - 35282.287715171685310157997216i
  erfc(3.5+3.5i) = 0.112870728760415727792585 - 0.015026380322129921373706i
  */
  var a = Math.exp(-x * x);
  if (x >= 0) return a * Jmat.Real.faddeeva(0, x)[0];
  else return 2 - a * Jmat.Real.faddeeva(0, -x)[0];
};

//erfi(x) = -i erf(iz)
Jmat.Real.erfi = function(x) {
  var a = Math.exp(x * x);
  return a * Jmat.Real.faddeeva(x, 0)[1];
};

// D+(x) aka F(x)
Jmat.Real.dawson = function(x) {
  var a = Math.exp(-x * x);
  var w = Jmat.Real.faddeeva(x, 0)[1];
  return -(a - w) * (Jmat.Real.SQRTPI / 2);
};

// fast but inaccurate
Jmat.Real.erf_fast_ = function(x) {
  var neg = x < 0;
  if(neg) x = -x;

  if (x == 0) return 0;
  var t = 1 / (1 + 0.3275911 * x);
  var p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 +
          t * (-1.453152027 + t * 1.061405429))));
  var result = 1.0 - p * Math.exp(-(x*x));

  if(neg) result = -result;
  return result;
};

// fast but inaccurate
Jmat.Real.erfc_fast_ = function(x) {
  var neg = x < 0;
  if(neg) x = -x;
  var result;

  if(x <= 0.5) {
    var x2 = x * x;
    var x3 = x * x2;
    var x5 = x3 * x2;
    var x7 = x5 * x2;
    result = 1 - 2 / Jmat.Real.SQRTPI * (x - x3 / 3 + x5 / 10 + x7 / 42);
    //result = Math.exp(-x*x) / 6 + Math.exp(-0.75 * x * x) / 2;
  } else if (x >= 5) {
    // asymptotic expansion for large real x
    var x2 = x * x;
    var x4 = x2 * x2;
    var x6 = x4 * x2;
    var x8 = x6 * x2;
    result = Math.exp(-(x*x)) / (x * Jmat.Real.SQRTPI) * (1 - 1/2.0/x2 + 3/4.0/x4 - 15/8.0/x6 + 105/16.0/x8);
  } else {
    var t = 1 / (1 + 0.3275911 * x);
    var p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    result = p * Math.exp(-(x*x));
  }

  if(neg) result = 2 - result;
  return result;
};

// fast but inaccurate
Jmat.Real.dawson_fast_ = function(x) {
  var x2 = x * x;
  var x4 = x2 * x2;
  var x6 = x4 * x2;
  var x8 = x6 * x2;
  var x10 = x8 * x2;
  var x12 = x10 * x2;

  var p1 = 0.1049934947, p2 = 0.0424060604, p3 = 0.0072644182, p4 = 0.0005064034, p5 = 0.0001789971;
  var q1 = 0.7715471019, q2 = 0.2909738639, q3 = 0.0694555761, q4 = 0.0140005442, q5 = 0.0008327945;

  var p = 1 + p1 * x2 + p2 * x4 + p3 * x6 + p4 * x8 + p5 * x10;
  var q = 1 + q1 * x2 + q2 * x4 + q3 * x6 + q4 * x8 + q5 * x10 + 2 * p5 * x12;

  return p / q * x;
};

// fast but inaccurate
Jmat.Real.erfi_fast_ = function(x) {
  var neg = false;
  if(x < 0) {
    x = -x;
    neg = true;
  }
  var result = 0;
  var ps = 1.0 / Jmat.Real.SQRTPI;

  if(x <= 0.5) {
    // only gives good approximation for x < 0.5 or so
    var x3 = x * x * x;
    var x5 = x3 * x * x;
    var x7 = x5 * x * x;
    var t = 2*x + 2/3*x3 + 1/5*x5 + 1/21*x7;
    result = ps * t;
  } else if (x >= 5) {
    // only gives good approximation for x > 5 or so
    var xi = 1 / x;
    var xi3 = xi * xi * xi;
    var xi5 = xi3 * xi * xi;
    var xi7 = xi5 * xi * xi;
    var e = Math.exp(x * x);
    var t = xi + 1/2*xi3 + 3/4*xi5 + 15/8*xi7;
    result = ps * e * t;
  } else {
    result = 2 / Jmat.Real.SQRTPI * Math.exp(x * x) * Jmat.Real.dawson(x);
  }

  if(neg) result = -result;
  return result;
};

////////////////////////////////////////////////////////////////////////////////

// decimal to degrees/minutes/second (e.g. 1.5 degrees becomes 1.30 (1 degree and 30 minutes))
Jmat.Real.dms = function(a) {
  var neg = a < 0;
  if(neg) a = -a;

  var deg = Math.floor(a);
  var mins = Math.floor((a * 60 - deg * 60));
  var sec = Math.floor(a * 3600 - deg * 3600 - mins * 60);

  var result = deg + mins / 100.0 + sec / 10000.0;

  if(neg) result = -result;
  return result;
};

// degrees/minutes/second to decimal degrees (e.g. 1.30 (1 deg 30 minutes) becomes 1.5 degrees)
Jmat.Real.dd = function(a) {
  var neg = a < 0;
  if(neg) a = -a;

  var deg = Math.floor(a);
  var mins = Math.floor((a * 100 - deg * 100));
  var sec = Math.floor(a * 10000 - deg * 10000 - mins * 100);

  var result = deg + mins / 60.0 + sec / 3600.0;

  if(neg) result = -result;
  return result;
};

// Like Math.round, but for fractional parts of 0.5, it is rounded to the nearest even value.
Jmat.Real.round = function(x) {
  // return Math.round(x);
  var l = Math.floor(x);
  var f = x - l;
  if(f == 0.5) return (l % 2 == 0) ? l : (l + 1)
  return (f < 0.5) ? l : (l + 1);
};

// Truncates towards zero
Jmat.Real.trunc = Math.trunc || function(x) {
  return (x < 0) ? Math.ceil(x) : Math.floor(x);
};

// Linear interpolation from a to b
Jmat.Real.lerp = function(a, b, x) {
  return (1 - x) * a + x * b;
};

// ECMAScript 5 doesn't have it
Jmat.Real.sinh = Math.sinh || function(x) {
  return (Math.exp(x) - Math.exp(-x)) / 2;
};

// ECMAScript 5 doesn't have it
Jmat.Real.cosh = Math.cosh || function(x) {
  return (Math.exp(x) + Math.exp(-x)) / 2;
};

// ECMAScript 5 doesn't have it
Jmat.Real.tanh = Math.tanh || function(x) {
  if(x > 354) return 1; // exp overflow
  return (Math.exp(2 * x) - 1) / (Math.exp(2 * x) + 1);
};

// ECMAScript 5 doesn't have it
Jmat.Real.asinh = Math.asinh || function(x) {
  if(x == -Infinity) {
    return x;
  } else {
    return Math.log(x + Math.sqrt(x * x + 1));
  }
};

// ECMAScript 5 doesn't have it
Jmat.Real.acosh = Math.acosh || function(x) {
  return Math.log(x + Math.sqrt(x * x - 1));
};

// ECMAScript 5 doesn't have it
Jmat.Real.atanh = Math.atanh || function(x) {
  return Math.log((1 + x) / (1 - x)) / 2;
};

// returns sqrt(x^2 + y^2), avoiding numerical underflow or overflow ; a companion to atan2
// Unlike Math.hypot from the JavaScript ES6 standard, this function does not support multiple arguments, only exactly two.
Jmat.Real.hypot = function(x, y) {
  x = Math.abs(x);
  y = Math.abs(y);
  var t = Math.min(x, y);
  x = Math.max(x, y);
  if(x == Infinity) return Infinity;
  t /= x;
  return x * Math.sqrt(1 + t * t);
};

//exp(x) - 1, with better precision for x around 0
Jmat.Real.expm1 = function(x) {
  if(Math.abs(x) < 1e-5) return x + x * x / 2 + x * x * x / 6;
  else return Math.exp(x) - 1;
};

////////////////////////////////////////////////////////////////////////////////

// Replicate the rest of JS Math library.

Jmat.Real.abs = Math.abs;
Jmat.Real.floor = Math.floor;
Jmat.Real.ceil = Math.ceil;
Jmat.Real.min = Math.min;
Jmat.Real.max = Math.max;
Jmat.Real.exp = Math.exp;
Jmat.Real.log = Math.log;
Jmat.Real.sqrt = Math.sqrt;
Jmat.Real.pow = Math.pow;
Jmat.Real.sin = Math.sin;
Jmat.Real.cos = Math.cos;
Jmat.Real.tan = Math.tan;
Jmat.Real.asin = Math.asin;
Jmat.Real.acos = Math.acos;
Jmat.Real.atan = Math.atan;
Jmat.Real.atan2 = Math.atan2;

////////////////////////////////////////////////////////////////////////////////

Jmat.Real.isLeapYear = function(y) {
  return (y % 400 == 0) || (y % 4 == 0 && y % 100 != 0);
};

Jmat.Real.montharray_ = [-1 /*there is no month 0*/, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; //february must be adjusted for leap year

Jmat.Real.monthLength = function(month, leap) {
  return (leap && month == 2) ? 29 : Jmat.Real.montharray_[month];
};


//number of days since the first day of year 0. 1 january of the year 0 is 0. 2 january is 1, etc...
//only for Gregorian calendar, does not take Julian calendar into account
Jmat.Real.numDaysSince0 = function(year, month, day) {
  var R = Jmat.Real;

  //number of leap years before this year (year 0 is considered leap)
  var numleap = year == 0 ? 0 : (R.idiv(year - 1, 4) - R.idiv(year - 1, 100) + R.idiv(year - 1, 400) + 1);
  var yeardays = year * 365 + numleap; //days of years before this year

  var feb = month > 2 ? (Jmat.Real.isLeapYear(year) ? 1 : 2) : 0; //days to subtract from formula below due to february
  var aug = (month > 8 && month % 2 == 1) ? 1 : 0; //correction because august shifts who has 31 days
  var monthdays = (month - 1) * 30 + R.idiv(month, 2) - feb + aug;

  return yeardays + monthdays + day - 1; //-1 because day 1 is in fact zero
};

//converts number of days since the year 0, to year/month/day
//returns array [year, month, day]
//only for Gregorian calendar, does not take Julian calendar into account
Jmat.Real.daysSince0ToDate = function(days) {
  //every 400 years there are 97 leap years. So a year is 365.2425 days in average.
  var year = Math.floor(days / 365.2425);
  var leap = Jmat.Real.isLeapYear(year);

  days -= Jmat.Real.numDaysSince0(year, 1, 1);

  // TODO: replace the for loop with shorter expressions
  var month = 0;
  for (var i = 1; i <= 12; i++) {
    month++;
    var num = Jmat.Real.monthLength(i, leap);
    if (days >= num /*>= because of the +1 done at the end to turn zero based into one based indexing*/) {
      days -= num;
    } else {
      break;
    }
  }

  return [year, month, days + 1 /*because month day starts at 1 instead of 0*/];
};

//determines day of week (0=sun, 1=mon, 2=tue, 3=wed, 4-thu, 5-fri, 6=sat), given year (e.g. 2014), month (1-12), day (1-31).
Jmat.Real.dayOfWeek = function(y, m, d) {
  var R = Jmat.Real;
  d += (m < 3) ? (y--) : (y - 2);
  return (R.idiv(23 * m, 9) + d + 4 + R.idiv(y, 4) - R.idiv(y, 100) + R.idiv(y, 400)) % 7;
};

////////////////////////////////////////////////////////////////////////////////

/*
Here are a few matrix algorithms in Jmat.Real. Much more algorithms are in
Jmat.Matrix. However, the ones here work only on real numbers, and do not use
any special class for matrices, just 2D arrays. The length of the array is the
matrix height, sub-arrays are rows. Sometimes a column vector is given as a 1D
array.
*/

Jmat.Real.matrix_add = function(a, b) {
  if(a.length != b.length || a[0].length != b[0].length) return undefined;
  var c = [];
  for(var y = 0; y < a.length; y++) {
    c[y] = [];
    for(var x = 0; x < a[y].length; x++) {
      c[y][x] = a[y][x] + b[y][x];
    }
  }
  return c;
};

Jmat.Real.matrix_sub = function(a, b) {
  if(a.length != b.length || a[0].length != b[0].length) return undefined;
  var c = [];
  for(var y = 0; y < a.length; y++) {
    c[y] = [];
    for(var x = 0; x < a[y].length; x++) {
      c[y][x] = a[y][x] - b[y][x];
    }
  }
  return c;
};

Jmat.Real.matrix_mul = function(a, b) {
  // TODO: add strassen algorithm
  var m = a.length;
  var n = a[0].length;
  var p = b[0].length;
  if(n != b.length) return undefined;
  var result = [];
  for (var y = 0; y < m; y++) result[y] = [];
  var temp = [];
  for (var x = 0; x < p; x++) {
    for (var z = 0; z < n; z++) temp[z] = b[z][x]; // copy for better caching (faster)
    for (var y = 0; y < m; y++) {
      var e = 0;
      for (var z = 0; z < n; z++) e += a[y][z] * temp[z];
      result[y][x] = e;
    }
  }
  return result;
};

Jmat.Real.matrix_mulr = function(a, v) {
  var r = [];
  for(var y = 0; y < a.length; y++) {
    r[y] = [];
    for(var x = 0; x < a[y].length; x++) {
      r[y][x] = a[y][x] * v;
    }
  }
  return r;
};

Jmat.Real.matrix_divr = function(a, v) {
  var r = [];
  for(var y = 0; y < a.length; y++) {
    r[y] = [];
    for(var x = 0; x < a[y].length; x++) {
      r[y][x] = a[y][x] / v;
    }
  }
  return r;
};

Jmat.Real.matrix_transpose = function(m) {
  var result = [];
  for(var y = 0; y < m[0].length; y++) {
    result[y] = [];
    for(var x = 0; x < m.length; x++) {
      result[y][x] = m[x][y];
    }
  }
  return result;
};

// Bring a to reduced row echelon form, in-place (modifies the input object)
Jmat.Real.matrix_rref = function(a) {
  var h = a.length;
  var w = a[0].length;

  var swaprow = function(matrix, y0, y1) {
    var temp = matrix[y0];
    matrix[y0] = matrix[y1];
    matrix[y1] = temp;
  };

  // subtracts f * y0 from y1 (modifying row y1), starting from x.
  var subrow = function(matrix, x, y0, y1, f) {
    var w = matrix[0].length;
    for (var i = x; i < w; i++) {
      matrix[y1][i] -= f * matrix[y0][i];
    }
  };

  // only starts at x rather than from the beginning
  var mulrow = function(matrix, x, y, v) {
    for (var i = x; i < w; i++) {
      matrix[y][i] = matrix[y][i] * v;
    }
  };

  var pivots = []; // x coordinate of pivot in each row (except the zero rows at the end, so may have smaller length than h)

  // gaussian elimination
  var k2 = 0; //next row, equal to k unless there are zero-rows
  for(var k = 0; k < w; k++) {
    var n = Jmat.Real.argmax(k2, h, function(i) { return Math.abs(a[i][k]); });
    if (a[n][k] == 0) continue; // singular, leave row as is
    if(k2 != n) swaprow(a, k2, n);
    mulrow(a, k, k2, 1 / a[k2][k]); // pivot is now 1
    for (var i = k2 + 1; i < h; i++) {
      if(a[i][k] != 0) subrow(a, k, k2, i, a[i][k]);
      a[i][k] = 0; // make extra-sure it's 0, avoid numerical imprecision
    }
    pivots.push(k);
    k2++;
    if(k2 >= h) break;
  }

  //now bring from row echolon form to reduced row echolon form
  for(var k = 0; k < pivots.length; k++) {
    var p = pivots[k];
    for(var y = k - 1; y >= 0; y--) {
      if(a[y][p] != 0) subrow(a, p, k, y, a[y][p]);
      a[y][p] = 0; // make extra-sure it's 0, avoid numerical imprecision
    }
  }

  return a;
};

// solves A*X = B. B and result are column vector given as 1D array.
Jmat.Real.matrix_solve = function(a, b) {
  var aug = [];
  for(var y = 0; y < a.length; y++) {
    aug[y] = [];
    for(var x = 0; x < a[y].length; x++) aug[y][x] = a[y][x];
    aug[y].push(b[y] || 0);
  }

  var r = Jmat.Real.matrix_rref(aug);

  // If we got a non-square a as input, our output size must be the width, not height, of a.
  var result = [];
  for(var i = 0; i < r[0].length - 1; i++) result[i] = r[i][r[i].length - 1];
  return result;
};

// This is a matrix algorithm, but is in Jmat.Real because it operates on real elements, and you can use the algorithm without Matrix class.
// Jacobi eigenvalue algorithm for real symmetric matrix
// a is n*n 2D array with input and output matrix (real symmetric), contains eigenvalues on diagonal after the algorithm (sorted)
// v is n*n 2D output array (may be initialized as []), matrix which will contain eigenvectors as rows after the algorithm (normalized)
// n is matrix size
// opt_epsilon is precision for when to stop the iterations (default 1e-15)
Jmat.Real.matrix_jacobi = function(a, v, n, opt_epsilon) {
  var epsilon = opt_epsilon == undefined ? 1e-15 : opt_epsilon;

  // Make identity
  for(var y = 0; y < n; y++) {
    v[y] = [];
    for(var x = 0; x < n; x++) {
      v[y][x] = (x == y) ? 1 : 0;
    }
  }

  // Sum of squares of all off-diagonal elements
  var off2 = 0;
  for(var y = 0; y < n; y++) {
    for(var x = y + 1; x < n; x++) {
      if(x != y) {
        off2 += 2 * a[y][x] * a[y][x];
      }
    }
  }

  while(off2 > epsilon) {
    for(var y = 0; y < n; y++) {
      for(var x = y + 1; x < n; x++) {
        if(a[y][x] * a[y][x] <= off2 / (2 * n * n)) continue; // Too small
        off2 -= 2 * a[y][x] * a[y][x];
        // Jacobi rotation coefficients
        var beta = (a[x][x] - a[y][y]) / (2 * a[y][x]);
        var t = Math.sign(beta) / (Math.abs(beta) + Math.sqrt(beta * beta + 1));
        var s = 1 / (Math.sqrt(t * t + 1));
        var c = s * t;
        // Rotate rows of A
        for(var k = 0; k < n; k++) {
          var tmp = a[k][y];
          a[k][y] = s * a[k][x] + c * tmp;
          a[k][x] = c * a[k][x] - s * tmp;
        }
        // Rotate columns of A and V
        for(var k = 0; k < n; k++) {
          var tmp = a[y][k];
          a[y][k] = s * a[x][k] + c * tmp;
          a[x][k] = c * a[x][k] - s * tmp ;
          tmp = v[y][k];
          v[y][k] = s * v[x][k] + c * tmp;
          v[x][k] = c * v[x][k] - s * tmp;
        }
      }
    }
  }

  // Sort eigenvalues if needed
  for(var k = 0; k < n; k++) {
    var m = k;
    for(var l = k + 1; l < n; l++) {
      if(a[l][l] > a[m][m]) m = l;
    }
    if(k != m) {
      var tmp = a[m][m];
      a[m][m] = a[k][k];
      a[k][k] = tmp;
      for(var l = 0; l < n; l++) {
        var tmp = v[m][l];
        v[m][l] = v[k][l];
        v[k][l] = tmp;
      }
    }
  }
};

////////////////////////////////////////////////////////////////////////////////

//f is function taking integer index as parameter and returning a real
//returns index belonging to max return value of f in index range [s, e)
Jmat.Real.argmax = function(s, e, f) {
  var m = f(s);
  var b = s;
  for(var i = s + 1; i < e; i++) {
    var mi = f(i);
    if(mi > m) {
      m = mi;
      b = i;
    }
  }
  return b;
};


/*
Jmat.js

Copyright (c) 2011-2016, Lode Vandevenne
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// REQUIRES: jmat_real.js

/*
Jmat.Complex: arithmetic on complex numbers

Overview of some functionality:
-elementary arithmetic: Complex.add, Complex.sub, Complex.mul, Complex.div
-mathematical functions: Complex.pow, Complex.exp, Complex.sqrt, Complex.log, Complex.cos, Complex.cosh, Complex.acos, ...
-special functions: Complex.erf, Complex.lambertw, Complex.gamma (more are in jmat_special.js)
-fft
*/

/*
Constructor, but also usable without new as factory function.

Class representing a complex value with real and imaginary part.

Serves as both the actual object used as complex number, and namespace for most
complex mathematical functions.

The only sad thing is that Javascript doesn't support operator overloading
and nice expressions like a + b have to become a.add(b) instead.

When used as factory function, makes it easy to construct values, e.g. if you
set C = Jmat.Complex, you can create real value 1 with C(1), or a complex value
with C('1+2i') or C(1, 2).
*/
Jmat.Complex = function(re, im) {
  if(this instanceof Jmat.Complex) {
    // Keyword "new" in front. Does not do any checks, to be "fast"
    this.re = re;
    this.im = im;
  } else {
    // No keyword "new" in front, use the convenience factory function instead
    return Jmat.Complex.make(re, im); // This supports several argument types
  }
};

// TODO: define a bit better which combinations of Infinity/Nan/... in re and im mean what (E.g. re and im both Infinity means "undirected infinity", already used by gamma function but by nothing else)

// Create a new Jmat.Complex value. Copies Jmat.Complex if a Jmat.Complex is given as first argument
// with 0 arguments, creates zero value. With a and b numbers, creates complex number from it. With a Jmat.Complex object, copies it.
// the first parameter must be given and be number or Jmat.Complex. The second parameter is optional.
Jmat.Complex.make = function(a, b) {
  if(a == undefined) return new Jmat.Complex(0, 0);
  if(typeof a == 'number') return new Jmat.Complex(a, b == undefined ? 0 : b);
  if(typeof a == 'string') return Jmat.Complex.parse(a);
  return new Jmat.Complex(a.re, a.im); // Copy value object
};

// Create a new Jmat.Complex value, real
Jmat.Complex.newr = function(re) {
  return new Jmat.Complex(re, 0);
};

// Create a new Jmat.Complex value, imaginary
Jmat.Complex.newi = function(im) {
  return new Jmat.Complex(0, im);
};

// Create a new Jmat.Complex value, polar
Jmat.Complex.polar = function(r, a) {
  return new Jmat.Complex(r * Math.cos(a), r * Math.sin(a));
};

// Casts the given number type to Jmat.Complex. If the given type is already of type Jmat.Complex, does not copy it but returns the input.
// TODO: also support strings of the form '5+6i', and be able to parse them
Jmat.Complex.cast = function(v) {
  if(v && v.re != undefined) return v;
  if(v == undefined) return Jmat.Complex(0);
  return Jmat.Complex(v);
};

//aka clone
Jmat.Complex.copy = function(v) {
  return new Jmat.Complex(v.re, v.im);
};

// Because JS number toFixed appends zeros
Jmat.Complex.formatFloat_ = function(value, precision) {
  var power = Math.pow(10, precision || 0);
  return String(Math.round(value * power) / power);
};

//debugstring
Jmat.Complex.toString = function(value, opt_precision) {
  if(!value) return value == 0 ? 'invalid0' : ('' + value);
  var re = (opt_precision ? Jmat.Complex.formatFloat_(value.re, opt_precision) : ('' + value.re));
  var im = (opt_precision ? Jmat.Complex.formatFloat_(value.im, opt_precision) : ('' + value.im));

  if(value.im == 0 || im == '0') return '' + re;
  if(value.re == 0) return '' + im + 'i';
  if(value.im < 0) return '' + re + im + 'i';
  return '' + re + '+' + im + 'i';
};
Jmat.Complex.prototype.toString = function(opt_precision) {
  return Jmat.Complex.toString(this, opt_precision);
};

// Parses strings of the form '5', '5+i', '5-2.3i', '1.25e-25+17.37e5i'
Jmat.Complex.parse = function(text) {
  var i = text.indexOf('i');
  if(i == -1) {
    return Jmat.Complex(parseFloat(text));
  } else {
    if(text == 'i') return Jmat.Complex(0, 1);
    text = text.substr(0, i); // remove the i and anything after it
    text = text.replace(/ /g, ''); // support forms with spaces like '5 + 2i' too
    // Make it handle it correctly if just 'i' without number in front is used
    if(text[i - 1] == '+' || text[i - 1] == '-') text += '1';

    // Find the + or - which is not after an 'e' or 'E'
    for(var j = 1; j < text.length; j++) {
      if((text[j] == '+' || text[j] == '-') && !(text[j - 1] == 'e' || text[j - 1] == 'E')) {
        return Jmat.Complex(parseFloat(text.substr(0, j)), parseFloat(text.substr(j)));
      }
    }
    return Jmat.Complex(0, parseFloat(text)); // pure imaginary
  }
};

// Only use these as constants, never modify these, never return them!
Jmat.Complex.ZERO = Jmat.Complex(0);
Jmat.Complex.ONE = Jmat.Complex(1);
Jmat.Complex.TWO = Jmat.Complex(2);
Jmat.Complex.I = Jmat.Complex.newi(1);
Jmat.Complex.PI = Jmat.Complex(Math.PI);
Jmat.Complex.E = Jmat.Complex(Math.E);
Jmat.Complex.SQRT2 = Jmat.Complex(Math.sqrt(2));
Jmat.Complex.SQRTPI = Jmat.Complex(Math.sqrt(Math.PI));
Jmat.Complex.INVSQRT2PI = Jmat.Complex(1 / Math.sqrt(2 * Math.PI)); //0.3989422804014327
Jmat.Complex.EM = Jmat.Complex(Jmat.Real.EM); // Euler-Mascheroni constant
Jmat.Complex.APERY = Jmat.Complex(Jmat.Real.APERY); // Apery's constant, zeta(3)

Jmat.Complex.real = function(z) {
  return Jmat.Complex(z.re);
};
Jmat.Complex.prototype.real = function() {
  return Jmat.Complex(this.re);
};

Jmat.Complex.imag = function(z) {
  return Jmat.Complex(z.im);
};
Jmat.Complex.prototype.imag = function() {
  return Jmat.Complex(this.im);
};

//Basic operators

Jmat.Complex.add = function(x, y) {
  return new Jmat.Complex(x.re + y.re, x.im + y.im);
};
Jmat.Complex.prototype.add = function(y) {
  return new Jmat.Complex(this.re + y.re, this.im + y.im);
};

Jmat.Complex.sub = function(x, y) {
  return new Jmat.Complex(x.re - y.re, x.im - y.im);
};
Jmat.Complex.prototype.sub = function(y) {
  return new Jmat.Complex(this.re - y.re, this.im - y.im);
};

Jmat.Complex.mul = function(x, y) {
  if(x.im == 0 && y.im == 0) {
    return new Jmat.Complex(x.re * y.re, 0);
  } else {
    var re = x.re * y.re - x.im * y.im;
    var im = x.im * y.re + x.re * y.im;
    return new Jmat.Complex(re, im);
  }
};
Jmat.Complex.prototype.mul = function(y) {
  return Jmat.Complex.mul(this, y);
};

Jmat.Complex.div = function(x, y) {
  if(x.im == 0 && y.im == 0) {
    return new Jmat.Complex(x.re / y.re, 0);
  } else {
    if(Jmat.Complex.isInf(x) && !Jmat.Complex.isInfOrNaN(y)) {
      // Result should be some infinity (because it's infinity divided through finite value), but the formula below would give a NaN somewhere.
      // 4 possible rotations of the infinity, based on quadrant of y (TODO: THIS IS IGNORED NOW!!)
      return x;
    }
    var d = y.re * y.re + y.im * y.im;
    if(d == Infinity || d == -Infinity) {
      // the calculations below would give Infinity/Infinity = NaN even though result should be 0.
      if(!Jmat.Complex.isInfOrNaN(x)) return Jmat.Complex(0);
    }
    if(d == 0 && !Jmat.Complex.isInfOrNaN(x) && (x.re != 0 || x.im != 0)) {
      // the calculations below would give 0/0 = NaN even though result should be some infinity.
      return new Jmat.Complex(x.re == 0 ? 0 : (x.re < 0 ? -Infinity : Infinity), x.im == 0 ? 0 : (x.im < 0 ? -Infinity : Infinity));
    }
    d = 1.0 / d; // optimization: avoid multiple times the same division
    var re, im;
    if(d > 1) {
      re = (x.re * y.re + x.im * y.im) * d;
      im = (x.im * y.re - x.re * y.im) * d;
    } else {
      // the multiplications with d are in the center, to avoid overflow in case e.g. x.re*y.re overflows floating point
      re = x.re * d * y.re + x.im * d * y.im;
      im = x.im * d * y.re - x.re * d * y.im;
    }
    return new Jmat.Complex(re, im);
  }
};
Jmat.Complex.prototype.div = function(y) {
  return Jmat.Complex.div(this, y);
};

Jmat.Complex.addr = function(z, a) {
  return new Jmat.Complex(z.re + a, z.im);
};
Jmat.Complex.prototype.addr = function(a) {
  return new Jmat.Complex(this.re + a, this.im);
};
Jmat.Complex.addi = function(z, a) {
  return new Jmat.Complex(z.re, z.im + a);
};
Jmat.Complex.prototype.addi = function(a) {
  return new Jmat.Complex(this.re, this.im + a);
};

Jmat.Complex.subr = function(z, a) {
  return new Jmat.Complex(z.re - a, z.im);
};
Jmat.Complex.prototype.subr = function(a) {
  return new Jmat.Complex(this.re - a, this.im);
};
// Subtract z from real.
Jmat.Complex.rsub = function(a, z) {
  return new Jmat.Complex(a - z.re, -z.im);
};
// Subtract self from real. This operator exists because it's less awkward to write z.rsub(3) than Complex(3).sub(z) in long formulas
Jmat.Complex.prototype.rsub = function(a) {
  return new Jmat.Complex(a - this.re, -this.im);
};
Jmat.Complex.subi = function(z, a) {
  return new Jmat.Complex(z.re, z.im - a);
};
Jmat.Complex.prototype.subi = function(a) {
  return new Jmat.Complex(this.re, this.im - a);
};

Jmat.Complex.mulr = function(z, a) {
  return new Jmat.Complex(z.re * a, z.im * a);
};
Jmat.Complex.prototype.mulr = function(a) {
  return new Jmat.Complex(this.re * a, this.im * a);
};
// multiply with imaginary number given as real
Jmat.Complex.muli = function(z, a) {
  return new Jmat.Complex(-z.im * a, z.re * a);
};
Jmat.Complex.prototype.muli = function(a) {
  return new Jmat.Complex(-this.im * a, this.re * a);
};

Jmat.Complex.divr = function(z, a) {
  return new Jmat.Complex(z.re / a, z.im / a);
};
Jmat.Complex.prototype.divr = function(a) {
  return new Jmat.Complex(this.re / a, this.im / a);
};
// Divide real a through z.
Jmat.Complex.rdiv = function(a, z) {
  return new Jmat.Complex.div(Jmat.Complex(a), z);
};
// Divide real a through self. This operator exists because it's less awkward to write z.rsub(3) than Complex(3).div(z) in long formulas
Jmat.Complex.prototype.rdiv = function(a) {
  return Jmat.Complex.div(Jmat.Complex(a), this);
};
// divide through imaginary number given as real
Jmat.Complex.divi = function(z, a) {
  return new Jmat.Complex(z.im / a, -z.re / a);
};
Jmat.Complex.prototype.divi = function(a) {
  return new Jmat.Complex(this.im / a, -this.re / a);
};

//rotate complex number z by a radians. That is, change its argument. a is real (JS number).
Jmat.Complex.rotate = function(z, a) {
  if(a == 0) return z;
  return Jmat.Complex.polar(z.abs(), z.arg() + a);
};

//rotate complex number z by 2pi/n radians. This results in giving the next solution of the nth root.
Jmat.Complex.nextroot = function(z, n) {
  var result = Jmat.Complex.rotate(z, Math.PI * 2 / n);
  if(Jmat.Real.near(result.im, 0, 1e-14)) result.im = 0;
  return result;
};

// mod operation, result has the sign of the divisor (unlike % operator in JS, Java and C99), so it's like wrapping x in range 0..y.
// works on real or complex numbers too, e.g. (6+4i) mod (3+5i) gives (-2+2i)
Jmat.Complex.mod = function(x, y) {
  if(x.im != 0 || y.im != 0) return x.sub(Jmat.Complex.floor(x.div(y)).mul(y));
  return Jmat.Complex(Jmat.Real.mod(x.re, y.re));
};

// remainder operation, like the % operator in JS, Java and C99.
Jmat.Complex.rem = function(x, y) {
  if(x.im != 0 || y.im != 0) return x.sub(Jmat.Complex.trunc(x.div(y)).mul(y));
  return Jmat.Complex(x.re % y.re);
};

Jmat.Complex.wrap = function(x, from, to) {
  return new Jmat.Complex(Jmat.Real.wrap(x.re, from.re, to.re), Jmat.Real.wrap(x.im, from.im, to.im));
};

Jmat.Complex.clamp = function(x, from, to) {
  return new Jmat.Complex(Jmat.Real.clamp(x.re, from.re, to.re), Jmat.Real.clamp(x.im, from.im, to.im));
};

//Like JS ~: returns -(x + 1), limited to 32-bit int
Jmat.Complex.bitneg = function(x) {
  var result = Jmat.Complex(0);
  result.re = ~x.re;
  //imaginary part not bit-negated on purpose: otherwise it appears when bit-inverting real number, which is in 99.9% of the cases not wanted
  //instead negated, to follow the formula -(x + 1)
  //result.im = ~x.im;
  result.im = -x.im
  return result;
};

Jmat.Complex.bitand = function(x, y) {
  var result = Jmat.Complex(0);
  result.re = x.re & y.re;
  result.im = x.im & y.im;
  return result;
};

Jmat.Complex.bitor = function(x, y) {
  var result = Jmat.Complex(0);
  result.re = x.re | y.re;
  result.im = x.im | y.im;
  return result;
};

Jmat.Complex.bitxor = function(x, y) {
  var result = Jmat.Complex(0);
  result.re = x.re ^ y.re;
  result.im = x.im ^ y.im;
  return result;
};

Jmat.Complex.lshift = function(x, y) {
  var result = Jmat.Complex(0);
  result.re = x.re << y.re;
  result.im = x.im << y.im;
  return result;
};

Jmat.Complex.rshift = function(x, y) {
  var result = Jmat.Complex(0);
  result.re = x.re >> y.re;
  result.im = x.im >> y.im;
  return result;
};

Jmat.Complex.neg = function(x) {
  return Jmat.Complex(-x.re, -x.im);
};
Jmat.Complex.prototype.neg = function() {
  return Jmat.Complex(-this.re, -this.im);
};

// Returns 0 if z is 0, 1 if z is positive, -1 if z is negative. For complex z, returns z / abs(z)
// Another name for this could be "normalize" as it makes the length of the "vector" 1
Jmat.Complex.sign = function(z) {
  if (z.im == 0) {
    if(z.re == 0) return Jmat.Complex(0);
    else if(z.re < 0) return Jmat.Complex(-1);
    return Jmat.Complex(1);
  }

  return z.divr(z.abs());
};

// Returns 0 if z is 0, 1 if z is positive, -1 if z is negative. For complex z, returns sign of z.im if z.re == 0, sign of z.re otherwise (that is, the function returns sqrt(z*z) / z, except for z=0)
Jmat.Complex.csgn = function(z) {
  if (Jmat.Real.near(z.re, 0, 1e-15)) { //avoid numeric imprecisions for e.g. the values of e.g. acosh
    if(z.im == 0) return Jmat.Complex(0);
    else if(z.im < 0) return Jmat.Complex(-1);
    return Jmat.Complex(1);
  } else {
    if(z.re == 0) return Jmat.Complex(0);
    else if(z.re < 0) return Jmat.Complex(-1);
    return Jmat.Complex(1);
  }
};

// Similar to sign, but returns 1 if the input is 0
Jmat.Complex.sign1 = function(z) {
  if (z.im == 0) {
    if(z.re < 0) return Jmat.Complex(-1);
    return Jmat.Complex(1);
  }

  return z.divr(z.abs());
};

// Similar to csgn, but returns 1 if the input is 0
Jmat.Complex.csgn1 = function(z) {
  if (Jmat.Real.near(z.re, 0, 1e-15)) { //avoid numeric imprecisions
    if(z.im < 0) return Jmat.Complex(-1);
    return Jmat.Complex(1);
  } else {
    if(z.re < 0) return Jmat.Complex(-1);
    Jmat.Complex(1);
  }
};

// applies sign of y to x, so the result has the magnitude of x but the argument of y
Jmat.Complex.copysign = function(x, y) {
  return Jmat.Complex.abs(x).mul(Jmat.Complex.sign(y));
};

Jmat.Complex.conj = function(x) {
  return Jmat.Complex(x.re, -x.im);
};
Jmat.Complex.prototype.conj = function() {
  return Jmat.Complex(this.re, -this.im);
};

Jmat.Complex.eq = function(x, y) {
  if(!x || !y) return x == y;
  return (x.re == y.re && x.im == y.im);
};
Jmat.Complex.prototype.eq = function(y) {
  return y && this.re == y.re && this.im == y.im;
};

Jmat.Complex.eqr = function(x, y) {
  return (x.re == y && x.im == 0);
};
Jmat.Complex.prototype.eqr = function(y) {
  return (this.re == y && this.im == 0);
};

Jmat.Complex.inv = function(z) {
  return Jmat.Complex.ONE.div(z);
};
Jmat.Complex.prototype.inv = function() {
  return Jmat.Complex.ONE.div(this);
};

//increment
Jmat.Complex.inc = function(z) {
  return new Jmat.Complex(z.re + 1, z.im);
};
Jmat.Complex.prototype.inc = function() {
  return new Jmat.Complex(this.re + 1, this.im);
};

//decrement
Jmat.Complex.dec = function(z) {
  return new Jmat.Complex(z.re - 1, z.im);
};
Jmat.Complex.prototype.dec = function() {
  return new Jmat.Complex(this.re - 1, this.im);
};

// TODO: consider no longer have prototype.abs return real and Complex.abs return Complex. Use absr for real instead.
// absolute value, aka modulus of complex number, as a Jmat.Complex object (its imaginary part is 0)
Jmat.Complex.abs = function(x) {
  return Jmat.Complex(x.abs());
};
// absolute value, aka modulus of complex number, returned as real (regular JS number, to be similar to .re and .im)
Jmat.Complex.prototype.abs = function() {
  if(this.im == 0) return Math.abs(this.re);
  if(this.re == 0) return Math.abs(this.im);

  if(this.re == Infinity || this.re == -Infinity || this.im == Infinity || this.im == -Infinity) {
    return Infinity;
  }

  // Numerically more stable version of "Math.sqrt(x.re * x.re + x.im * x.im);"
  return Jmat.Real.hypot(this.re, this.im);
};

// absolute value squared, returned as Jmat.Complex object. This is faster than abs due to not taking sqrt.
Jmat.Complex.abssq = function(x) {
  return Jmat.Complex(x.re * x.re + x.im * x.im);
};
// absolute value squared, returned as real (regular JS number). This is faster than abs due to not taking sqrt.
Jmat.Complex.prototype.abssq = function() {
  return this.re * this.re + this.im * this.im;
};

// returns the complex argument in range -PI to +PI, as a Jmat.Complex object (its imaginary part is 0)
Jmat.Complex.arg = function(x) {
  return Jmat.Complex(x.arg());
};
// returns the complex argument in range -PI to +PI, as a real (regular JS number, to be similar to .re and .im)
Jmat.Complex.prototype.arg = function() {
  if(this.im == 0) return this.re < 0 ? Math.PI : 0;
  return Math.atan2(this.im, this.re);
};

//returns result in range 0-1 rather than -PI to PI, as a regular JS number. Useful for graphical representations, not for math. 0 matches 0 degrees, 0.5 matches 180 degrees, 0.999 matches around 359 degrees.
Jmat.Complex.arg1 = function(z) {
  var result = z.arg();
  if(result < 0) result += 2 * Math.PI;
  result /= (2 * Math.PI);
  if(result < 0) result = 0;
  if(result > 1) result = 1;
  return result;
};

//manhattan norm, returned as real
Jmat.Complex.abs1r = function(x) {
  return Math.abs(x.re) + Math.abs(x.im);
};

// returns sqrt(|x|^2 + |y|^2) with numerically more precise formula ; a companion to atan2
// if more than 2 arguments are given, calculates norm of all arguments
Jmat.Complex.hypot = function(x, y) {
  var C = Jmat.Complex;
  if(C.abs1r(y) > C.abs1r(x)) {
    var temp = x;
    x = y;
    y = temp;
  }
  if(C.isInf(x)) return Infinity;
  var t = y.div(x);
  return x.mul(C.sqrt(C.abssq(t).addr(1)));
};


////////////////////////////////////////////////////////////////////////////////
// Categories
////////////////////////////////////////////////////////////////////////////////

Jmat.Complex.isReal = function(z) {
  return z.im == 0;
};

Jmat.Complex.isImaginary = function(z) {
  return z.re == 0;
};

Jmat.Complex.isInt = function(z) {
  return z.im == 0 && Jmat.Real.isInt(z.re);
};

// Gaussian integer
Jmat.Complex.isGaussian = function(z) {
  return Jmat.Real.isInt(z.re) && Jmat.Real.isInt(z.im);
};

Jmat.Complex.isNaN = function(z) {
  return !z || isNaN(z.re) || isNaN(z.im);
};

//is infinite
Jmat.Complex.isInf = function(z) {
  return Math.abs(z.re) == Infinity || Math.abs(z.im) == Infinity;
};

//isnanorinf isinfornan
Jmat.Complex.isInfOrNaN = function(z) {
  return !z || Jmat.Real.isInfOrNaN(z.re) || Jmat.Real.isInfOrNaN(z.im);
};

//real and strictly positive
Jmat.Complex.isPositive = function(z) {
  return z.re > 0 && z.im == 0;
};

//real and strictly negative
Jmat.Complex.isNegative = function(z) {
  return z.re < 0 && z.im == 0;
};

Jmat.Complex.isPositiveOrZero = function(z) {
  return z.re >= 0 && z.im == 0;
};

Jmat.Complex.isNegativeOrZero = function(z) {
  return z.re <= 0 && z.im == 0;
};

//strictly positive
Jmat.Complex.isPositiveInt = function(z) {
  return Jmat.Complex.isInt(z) && z.re > 0;
};

//strictly negative
Jmat.Complex.isNegativeInt = function(z) {
  return Jmat.Complex.isInt(z) && z.re < 0;
};

Jmat.Complex.isPositiveIntOrZero = function(z) {
  return Jmat.Complex.isInt(z) && z.re >= 0;
};

Jmat.Complex.isNegativeIntOrZero = function(z) {
  return Jmat.Complex.isInt(z) && z.re <= 0;
};

// z is odd integer
Jmat.Complex.isOdd = function(z) {
  return Jmat.Complex.isInt(z) && Math.abs(z.re % 2) == 1;
};

// z is even integer
Jmat.Complex.isEven = function(z) {
  return Jmat.Complex.isInt(z) && z.re % 2 == 0;
};

////////////////////////////////////////////////////////////////////////////////

Jmat.Complex.pow = function(x, y) {
  var C = Jmat.Complex;
  if(C.isReal(x) && C.isReal(y) && (x.re >= 0 || y.re == Infinity || y.re == -Infinity || Jmat.Real.isInt(y.re))) {
    //if(x.re == 0 && y.re == 0) return C(NaN); // JS's pow returns 1 for 0^0
    // It is chosen to return 1 for 0^0, not NaN. NaN is mathematically more correct, however 0^0 is correct in many practical applications.
    return C(Math.pow(x.re, y.re));
  } else if(x.eqr(0)) {
    return y.re == 0 ? C(NaN) : C(y.re < 0 ? Infinity : 0);
  } else {
    // This is just one branch. In fact it returns a complex result for -3 ^ (1/3),
    // the cube root of -3. To get the real result, use absolute value (and then negate) on it.
    // This is correct: the principal result of the cube root for this is a complex number.
    // Note: This returns incorrect values for a negative real to the power of Infinity: the result should be -Infinity for < -1, 0 for > -1, NaN for -1, but it always gives NaN. However, the "if" part above already handles that.
    var r = x.abs();
    var t = x.arg();
    var u = Math.pow(r, y.re) * Math.exp(-y.im * t);
    if(isNaN(u)) {
      u = Math.pow(1, y.re / r) * Math.exp(-y.im * t / r);
      if(u < 0) u = -Infinity;
      else if(u > 0) u = Infinity;
      else u = NaN;
    }
    var v = y.im * Math.log(r) + y.re * t;
    return C(u * Math.cos(v), u * Math.sin(v));
  }
};
Jmat.Complex.prototype.pow = function(y) {
  return Jmat.Complex.pow(this, y);
};

Jmat.Complex.powr = function(z, a) {
  return Jmat.Complex.pow(z, Jmat.Complex(a));
};
Jmat.Complex.prototype.powr = function(a) {
  return Jmat.Complex.pow(this, Jmat.Complex(a));
};

// raise regular js number x, to complex power a
Jmat.Complex.rpow = function(x, a) {
  return Jmat.Complex.pow(Jmat.Complex(x), a);
};
// raise regular js number x, to this complex number
Jmat.Complex.prototype.rpow = function(x) {
  return Jmat.Complex.pow(Jmat.Complex(x), this);
};

Jmat.Complex.sin = function(z) {
  if(z.im == 0) return Jmat.Complex(Math.sin(z.re));

  var iz = Jmat.Complex(-z.im, z.re);
  var eiz = Jmat.Complex.exp(iz);
  var ieiz = Jmat.Complex.inv(eiz);
  return eiz.sub(ieiz).div(Jmat.Complex(0, 2));
};

//unnormalized sinc: sin(x) / x, but also defined for x = 0
Jmat.Complex.sinc = function(z) {
  if(z.eqr(0)) return Jmat.Complex(1);
  return Jmat.Complex.sin(z).div(z);
};

Jmat.Complex.cos = function(z) {
  if(z.im == 0) return Jmat.Complex(Math.cos(z.re));

  var iz = Jmat.Complex(-z.im, z.re);
  var eiz = Jmat.Complex.exp(iz);
  var ieiz = Jmat.Complex.inv(eiz);
  return eiz.add(ieiz).mulr(0.5);
};

Jmat.Complex.tan = function(z) {
  if(z.im == 0) return Jmat.Complex(Math.tan(z.re));

  var iz = Jmat.Complex(-z.im, z.re);
  var eiz = Jmat.Complex.exp(iz);
  var ieiz = Jmat.Complex.inv(eiz);
  return (eiz.sub(ieiz).div(Jmat.Complex(0, 2))).div(eiz.add(ieiz).mulr(0.5)); // Jmat.Complex.sin(z).div(Jmat.Complex.cos(z));
};

Jmat.Complex.asin = function(z) {
  if(z.im == 0 && z.re >= -1 && z.re <= 1) return Jmat.Complex(Math.asin(z.re));

  var s = Jmat.Complex.sqrt(Jmat.Complex.ONE.sub(z.mul(z)));
  var l = Jmat.Complex.log(Jmat.Complex(-z.im, z.re).add(s));
  return Jmat.Complex(l.im, -l.re);
};

Jmat.Complex.acos = function(z) {
  if(z.im == 0 && z.re >= -1 && z.re <= 1) return Jmat.Complex(Math.acos(z.re));

  //i * ln(x - i * sqrt(1-x^2))
  var s = Jmat.Complex.sqrt(Jmat.Complex.ONE.sub(z.mul(z))).mul(Jmat.Complex.I);
  var l = Jmat.Complex.log(z.add(s));
  return Jmat.Complex(l.im, -l.re);
};

Jmat.Complex.atan = function(z) {
  if(z.im == 0) return Jmat.Complex(Math.atan(z.re));

  var iz = Jmat.Complex(-z.im, z.re);
  var b = Jmat.Complex.ONE.sub(iz).div(iz.inc());
  var l = Jmat.Complex.log(b);
  return Jmat.Complex(-0.5 * l.im, 0.5 * l.re);
};

Jmat.Complex.atan2 = function(x, y) {
  var C = Jmat.Complex;
  if(!C.isReal(x) || !C.isReal(y)) {
    if(y.eqr(0)) return C(Math.PI / 2);
    // As per the definition, return atan of (x / y)
    return C.atan(x.div(y));
  } else {
    var result = C(0);
    result.re = Math.atan2(x.re, y.re);
    return result;
  }
};

Jmat.Complex.sinh = function(z) {
  var e = Jmat.Complex.exp(z);
  var ei = Jmat.Complex.inv(e);
  return e.sub(ei).divr(2);
};

Jmat.Complex.cosh = function(z) {
  var e = Jmat.Complex.exp(z);
  var ei = Jmat.Complex.inv(e);
  return e.add(ei).divr(2);
};

Jmat.Complex.tanh = function(z) {
  // at z.re > 709, exp gives infinity, at z.re > 304, it gets wrong value if z.im != 0
  if(z.re > 350) return Jmat.Complex(1);
  if(z.re < -350) return Jmat.Complex(-1);
  var e = Jmat.Complex.exp(z);
  var ei = Jmat.Complex.inv(e);
  return e.sub(ei).div(e.add(ei));
};

Jmat.Complex.asinh = function(z) {
  return Jmat.Complex.log(z.add(Jmat.Complex.sqrt(z.mul(z).addr(1))));
};

Jmat.Complex.acosh = function(z) {
  // ln(x + sqrt(z-1)*sqrt(z+1))
  return Jmat.Complex.log(z.add(Jmat.Complex.sqrt(z.subr(1)).mul(Jmat.Complex.sqrt(z.addr(1)))));
};

Jmat.Complex.atanh = function(z) {
  // 0.5 * (ln(1+z) - ln(1-z))
  return Jmat.Complex.log(z.addr(1).div(z.rsub(1))).mulr(0.5);
};

// This is NOT the logsine function (the integral). It's simply ln(sin(z))
//ln(sin(z)), with good approximation for large |Im(z)|. The thing is, for large imaginary values, sin(z) becomes huge, because it involves an exponential of the imaginary parts
// For large imaginary part (or very small below 0), log(sin(x)) fails while this function is then very accurate
Jmat.Complex.logsin = function(z) {
  if(z.im > -10 && z.im < 10) return Jmat.Complex.log(Jmat.Complex.sin(z));

  var ln2i = Jmat.Complex(0.69314718056, 1.570796326795); // ln(2i)
  // This approximation is using a formula e^ix/2i or -e^(-ix)/2i, instead of the full (e^ix - e^(-ix) / 2i) = sin(x). This requires the real part to be exactly in range -pi/2, 3pi/2. So wrap, since it's periodic.
  var p = Jmat.Complex(Jmat.Real.wrap(z.re, -Math.PI / 2, 3 * Math.PI / 2), z.im);
  if(z.im > 0) return Jmat.Complex.newi(Jmat.Complex.PI).sub(Jmat.Complex.I.mul(p)).sub(ln2i);
  else return Jmat.Complex.I.mul(p).sub(ln2i);
};

// See description of Jmat.Complex.logsin
Jmat.Complex.logcos = function(z) {
  return Jmat.Complex.logsin(z.rsub(Math.PI / 2));
};

Jmat.Complex.floor = function(x) {
  var result = Jmat.Complex(0);
  result.re = Math.floor(x.re);
  result.im = Math.floor(x.im);
  return result;
};

Jmat.Complex.ceil = function(x) {
  var result = Jmat.Complex(0);
  result.re = Math.ceil(x.re);
  result.im = Math.ceil(x.im);
  return result;
};

Jmat.Complex.round = function(x) {
  var result = Jmat.Complex(0);
  result.re = Jmat.Real.round(x.re);
  result.im = Jmat.Real.round(x.im);
  return result;
};

// truncate towards 0
Jmat.Complex.trunc = function(x) {
  var result = Jmat.Complex(0);
  result.re = x.re < 0 ? Math.ceil(x.re) : Math.floor(x.re);
  result.im = x.im < 0 ? Math.ceil(x.im) : Math.floor(x.im);
  return result;
};

// Fractional part of x, x - floor(x). NOTE: this variant gives positive results for negative x
Jmat.Complex.frac = function(x) {
  return Jmat.Complex(Jmat.Real.frac(x.re), Jmat.Real.frac(x.im));
};

// Fractional part of x, x - int(x). NOTE: this variant gives negative results for negative x
Jmat.Complex.fracn = function(x) {
  return Jmat.Complex(Jmat.Real.fracn(x.re), Jmat.Real.fracn(x.im));
};

// Linear interpolation
Jmat.Complex.lerp = function(a, b, x) {
  return x.rsub(1).mul(a).add(x.mul(b));
};

Jmat.Complex.exp = function(x) {
  if(x.im == 0) {
    return Jmat.Complex(Math.exp(x.re));
  } else {
    var ea = Math.exp(x.re);
    return new Jmat.Complex(ea * Math.cos(x.im), ea * Math.sin(x.im));
  }
};

//exp(x) - 1, with better precision for x around 0
Jmat.Complex.expm1 = function(x) {
  if(x.abssq() < 1e-5) return x.add(x.mul(x).divr(2)).add(x.mul(x).mul(x).divr(6));
  else return Jmat.Complex.exp(x).subr(1);
};

//natural log (base e, ln)
Jmat.Complex.log = function(x) {
  if(x.eqr(-Infinity)) return Jmat.Complex(Infinity);

  if(Jmat.Complex.isReal(x) && x.re >= 0) {
    return Jmat.Complex(Math.log(x.re));
  }

  return Jmat.Complex(Math.log(x.abs()), x.arg());
};

//ln(x + 1), with better precision for x around 0
Jmat.Complex.log1p = function(x) {
  if(x.abssq() < 1e-8) return x.mulr(-0.5).addr(1).mul(x);
  else return Jmat.Complex.log(x.addr(1));
};

//arbitrary log: log_y(x), y is also complex number
//warning: base y is second argument
Jmat.Complex.logy = function(x, y) {
  return Jmat.Complex.log(x).div(Jmat.Complex.log(y));
};

//arbitrary log: log_y(x), where y is a regular JS number
//warning: base y is second argument
Jmat.Complex.logr = function(x, y) {
  return Jmat.Complex.log(x).divr(Math.log(y));
};

Jmat.Complex.log2 = function(x) {
  return Jmat.Complex.log(x).divr(Math.LN2);
};

Jmat.Complex.log10 = function(x) {
  return Jmat.Complex.log(x).divr(Math.LN10);
};

// Complex square root. Sqrt has two solutions, this function always returns the solution with nonnegative real part.
Jmat.Complex.sqrt = function(x) {
  if(Jmat.Complex.isReal(x)) {
    var result = Jmat.Complex(0);
    if(x.re >= 0 || x.re != x.re) result.re = Math.sqrt(x.re);
    else result.im = Math.sqrt(-x.re);
    return result;
  } else return x.pow(Jmat.Complex(0.5));
};

Jmat.Complex.root = function(x, y) {
  return x.pow(Jmat.Complex(Jmat.Complex.inv(y)));
};

Jmat.Complex.rootr = function(x, y) {
  return x.pow(Jmat.Complex(1 / y));
};

Jmat.Complex.toInt = function(value) {
  return Math.round(value.re);
};

// normalizes even if re or im are infinite, e.g. (Infinity, -Infinity) becomes (1, -1), (0, Infinity) becomes (0, 1). Without infinities, remains as-is. Des not normalize to length 1.
Jmat.Complex.infNormalize = function(value) {
  if (Jmat.Complex.isNaN(value)) return Jmat.Complex(NaN);

  if (value.re == Infinity) {
    if (value.im == Infinity) return Jmat.Complex(1, 1);
    if (value.im == -Infinity) return Jmat.Complex(1, -1);
    return Jmat.Complex(1, 0);
  }
  if (value.re == -Infinity) {
    if (value.im == Infinity) return Jmat.Complex(-1, 1);
    if (value.im == -Infinity) return Jmat.Complex(-1, -1);
    return Jmat.Complex(-1, 0);
  }
  if (value.im == Infinity) {
    if (value.re == Infinity) return Jmat.Complex(1, 1);
    if (value.re == -Infinity) return Jmat.Complex(-1, 1);
    return Jmat.Complex(0, 1);
  }
  if (value.im == -Infinity) {
    if (value.re == Infinity) return Jmat.Complex(1, -1);
    if (value.re == -Infinity) return Jmat.Complex(-1, -1);
    return Jmat.Complex(0, -1);
  }

  return value.divr(value.abs());
};

// Automatically cache last value. Useful for parameters of statistical distributions that are often the same in repeated calls.
// Cache must be an array (initially []), so that this function can modify it to set the necessary values.
// Function fun is called with z.
// n is cache size
// if n is given, cache contains alternating: index, input0, result0, input1, result1, input2, result2, ... where index is circular pointer to fill in new cache values
// if n is not given, cache contains: input, result
Jmat.Complex.calcCache_ = function(z, fun, cache, n) {
  if(n) {
    for(var i = 0; i < n; i++) if(z.eq(cache[i * 2 + 1])) return cache[i * 2 + 2];
    var index = cache[0] || 0;
    index++;
    if(index >= n) index = 0;
    var result = fun(z);
    cache[index * 2 + 1] = z;
    cache[index * 2 + 2] = result;
    cache[0] = index;
    return result;
  } else {
    if(z.eq(cache[0])) return cache[1];
    var result = fun(z);
    cache[0] = z;
    cache[1] = result;
    return result;
  }
};

//Inspired by Wikipedia, Lanczos approximation, precision is around 15 decimal places
Jmat.Complex.gamma = function(z) {
  if(z.re == Infinity) return Jmat.Complex(Infinity);
  if(Jmat.Complex.isNegativeIntOrZero(z)) return Jmat.Complex(Infinity, Infinity); // Undirected infinity
  if(z.im == 0) return Jmat.Complex(Jmat.Real.gamma(z.re));

  // The internal function that doesn't do internal checks
  var gamma_ = function(z) {
    if(z.re < 0.5) {
      // Use the reflection formula, because, the approximation below is not accurate
      // for values around -6.5+0.1i
      // gamma(1-z)*gamma(z) = pi/sin(pi*z)
      var result = Jmat.Complex.PI.div(Jmat.Complex.sin(Jmat.Complex.PI.mul(z))).div(gamma_(Jmat.Complex.ONE.sub(z)));
      if(Jmat.Complex.isNaN(result)) result = Jmat.Complex(0); // For those values that it can't calculate, it's 0 on the negative side of the complex plane.
      return result;
    }

    var g = 7;
    var p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
             771.32342877765313, -176.61502916214059, 12.507343278686905,
             -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

    z = z.subr(1);
    var x = Jmat.Complex(p[0]);
    for(var i = 1; i < g + 2; i++) {
      x = x.add(Jmat.Complex(p[i]).div(z.addr(i)));
    }
    var t = z.addr(g + 0.5);
    var pisq = Math.sqrt(Math.PI * 2);

    var w = t.pow(z.addr(0.5));
    var e = Jmat.Complex.exp(t.neg());

    var result = w.mul(e).mul(x).mulr(pisq);
    return result;
  };

  return gamma_(z);
};

Jmat.Complex.factorial = function(a) {
  return Jmat.Complex.gamma(Jmat.Complex.inc(a));
};


// Returns 0 or 1
// The reason this function is here as well as in Jmat.Real, while the other prime functions are only in Jmat.Real, is that this one needs to look at the imaginary part and say it's not prime if it's not zero
Jmat.Complex.isPrime = function(value) {
  if(!Jmat.Complex.isReal(value)) return 0; //complex numbers are not prime
  return Jmat.Real.isPrime(value.re);
};

// returns numerator and denominator of fraction
// max = max value for denominator (a real JS number)
Jmat.Complex.decompose = function(x, max) {
  if (Math.abs(x.re) >= Math.abs(x.im)) {
    var nd = Jmat.Real.decompose(x.re, max);
    var im = Math.round(x.im * nd[1]);
    return [Jmat.Complex(nd[0], im), Jmat.Complex(nd[1])];
  } else {
    var nd = Jmat.Real.decompose(x.im, max);
    var re = Math.round(x.re * nd[1]);
    return [Jmat.Complex(re, nd[0]), Jmat.Complex(nd[1])];
  }
};


Jmat.Complex.near = function(x, y, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  //return Jmat.Complex.manhattan(x, y) <= epsilon;
  // Manhattan NOT used, because then this function returns false for equal infinities
  return x.re - epsilon <= y.re && x.re + epsilon >= y.re && x.im - epsilon <= y.im && x.im + epsilon >= y.im;
};

// Near regular JS number y
Jmat.Complex.nearr = function(x, y, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  // Manhattan NOT used, because then this function returns false for equal infinities
  return x.re - epsilon <= y && x.re + epsilon >= y && x.im - epsilon <= 0 && x.im + epsilon >= 0;
};

// dist, cheb and manhattan all return regular real JS numbers for all types. In some types they are all the same, but not for e.g. Complex or Matrix.
// Euclidean distance
Jmat.Complex.dist = function(a, b) {
  return a.sub(b).abs();
};
//Chebyshev distance
Jmat.Complex.cheb = function(a, b) {
  return Math.max(Jmat.Real.dist(a.re, b.re), Jmat.Real.dist(a.im, b.im));
};
// Manhattan distance
Jmat.Complex.manhattan = function(a, b) {
  return Math.max(Math.abs(a.re - b.re), Math.abs(a.im - b.im));
};

/*
Precision must be near 0 but slightly larger, e.g. 0.001 for 3 digits of precision, 1e-5 for 5 digits, ...
That many digits must match, starting from the first non-zero digit.
That means, if one value is zero and the other is not, no matter how close to zero the other is, this function will always return false.
For complex numbers, allows different argument, as long as the distance between the two numbers is relatively tiny compared to their magnitude.
*/
Jmat.Complex.relnear = function(x, y, precision) {
  //return Jmat.Real.relnear(x.re, y.re, precision) && Jmat.Real.relnear(x.im, y.im, precision);
  if(x.eq(y)) return true;
  return x.sub(y).abs() < (Math.max(x.abs(), y.abs()) * precision);
};

// This works for quaternions as well.. set M to Jmat.Complex for complex number, or Jmat.Quaternion for quaternions.
Jmat.Complex.lambertwb_generic_ = function(M, branch, z) {
  if(M.isReal(z) && z.re > -0.36 /*~ -1/e*/ && branch == 0) return M(Jmat.Real.lambertw(z));

  if(!Jmat.Real.isInt(branch)) return M(NaN);


  // Known special values
  if(M.isNaN(z)) return NaN;
  if(M.isInf(z)) return M(Infinity); // any complex infinity gives positive infinity
  if(branch == 0 && z.eqr(0)) return M(0);
  if(branch != 0 && z.eqr(0)) return M(-Infinity); //at all other branch than the principal one, it's -infinity at 0

  /*
  Choosing a good starting value is important. M(0) as starting value works
  most of the time, but does not work at some regions in the negative complex domain,
  e.g. around 5.4+0.1i, 5.5+0.1i, ... and that can be seen as mandelbrot-fractal-like
  circles around those regions in the complex domain plot.
  */
  var w = M.log(z).add(M(0, branch * Math.PI * 2));
  if(branch == 0 && z.abs() < 1.2 /*supposed to be 1/Math.E, but I still see problems beyond that in the complex domain plot...*/) {
    w = M.sqrt(z.mulr(5.43656365691809047).addr(2)).add(M(-1, branch * Math.PI * 2)); //TODO: verify if this where ctor gets two arguments works correctly for quaternions?
  }
  if(branch != 0 && z.im == 0) z.im += 1e-14; // Give it small imaginary part, otherwise it never gets there // TODO: this does not work correctly for quaternions

  var num = 36;
  for(var i = 0; i < num; i++) {
    var ew = M.exp(w);
    var wew = w.mul(ew);
    var t = wew.sub(z);
    var a = ew.mul(w.addr(1));
    var b = w.addr(2).mul(t).div(w.mulr(2).addr(2));
    w = w.sub(t.div(a.sub(b)));

    var ltest = M.log(z.div(w)); //for testing if near (z = w*exp(w) OR ln(z/w) = w)
    if(M.near(ltest, w, 1e-16) || M.near(wew, z, 1e-16)) break;
    if(i + 1 == num && !(M.near(ltest, w, 1) || M.near(wew, z, 1))) return M(NaN); // iteration could not finish and too far from result
  }

  // Remove numeric tiny imaginary part that appeared in error
  if(z.im == 0 && z.re >= 0) w.im = 0;

  return w;
};

// Lambertw for branch (0 = principal branch Wp, -1 is also common (Wm))
// Branch is real integer, z is Jmat.Complex object (complex)
Jmat.Complex.lambertwb = function(branch, z) {
  return Jmat.Complex.lambertwb_generic_(Jmat.Complex, branch, z);
};

// Principal branch of Lambert's W function: Wp, inverse (not reciprocal) of exp(x) * x
Jmat.Complex.lambertw = function(z) {
  return Jmat.Complex.lambertwb(0, z);
};

// Negative branch of Lambert's W function: Wm, inverse (not reciprocal) of exp(x) * x
Jmat.Complex.lambertwm = function(z) {
  // TODO: wrong. Look at the real plot. Fix this! Jmat.plotReal(Jmat.Complex.lambertwm)
  return Jmat.Complex.lambertwb(-1, z);
};

////////////////////////////////////////////////////////////////////////////////

// Faddeeva function, used as helper functions to calculate erf and related functions for certain locations in the complex plane
// Faddeeva(z) = exp(-z^2)*erfc(-iz).
// Also known as Faddeyeva, or as w(x), but that may be confusing with LambertW...
Jmat.Complex.faddeeva = function(z) {
  var f = Jmat.Real.faddeeva(z.re, z.im);
  return Jmat.Complex(f[0], f[1]);
};

// erfcx(z) = exp(z^2) * erfc(z): the scaled complementary error function
Jmat.Complex.erfcx = function(z) {
  return Jmat.Complex.faddeeva(Jmat.Complex(-z.im, z.re)); //erfcx(z) = faddeeva(iz)
};

Jmat.Complex.erf = function(z) {
  var a = Jmat.Complex.exp(z.mul(z).neg()); // If abs of z is very large, and |im| > |re|, then this becomes some NaN or Infinity. That is ok, erf is also some unrepresentable huge value there.
  var result;
  if (z.re >= 0) result = Jmat.Complex.ONE.sub(a.mul(Jmat.Complex.faddeeva(z.mul(Jmat.Complex.I))));
  else return result = a.mul(Jmat.Complex.faddeeva(z.mul(Jmat.Complex.I.neg()))).sub(Jmat.Complex.ONE);
  // fix numerical imprecisions in case something is known to be exactly zero
  if(z.re == 0) result.re = 0; // pure imaginary input must give pure imaginary output, but due to subtracting from 1 it may be near-zero
  return result;

  // With integration, don't use.
  /*var ps2 = 2.0 / Jmat.Real.SQRTPI;
  var result;
  result = Jmat.Complex.integrate(Jmat.Complex(0), z, function(z){ return Jmat.Complex.exp(z.mul(z).neg()); }, 100);
  result = result.mulr(ps2);
  return result;*/
};

// erfc(x) = 1 - erf(x). This function gives numerically a better result if erf(x) is near 1.
Jmat.Complex.erfc = function(z) {
  var a = Jmat.Complex.exp(z.mul(z)); // we divide through this, rather than taking exp(-x*x) amd multiplying, to match what faddeeva does better, to ensure getting '1' for the real part in case of pure imaginary input
  if (z.re >= 0) return Jmat.Complex.faddeeva(z.mul(Jmat.Complex.I)).div(a);
  else return Jmat.Complex.TWO.sub(Jmat.Complex.faddeeva(z.mul(Jmat.Complex.I.neg())).div(a));
};


// TODO: rewrite some of the rational approximations to not use so many multiplications
//a + bx + cxx + dxxx + exxxx = a + x * (b + x * (c + x * (d + x * e)))   etc...
//and that equals: x.mulr(e).addr(d).mul(x).addr(c).mul(x).addr(b).mul(x).addr(a) ...


//erfi(z) = -i erf(iz)
Jmat.Complex.erfi = function(z) {
  return Jmat.Complex.erf(z.mul(Jmat.Complex.I)).mul(Jmat.Complex.I).neg();
};

// D+(x) aka F(x)
Jmat.Complex.dawson = function(z) {
  var w = Jmat.Complex.faddeeva(z);
  var a = Jmat.Complex.exp(z.mul(z).neg());
  return a.sub(w).mul(Jmat.Complex.I.mulr(Jmat.Real.SQRTPI / 2));
};

////////////////////////////////////////////////////////////////////////////////

// gives a random complex number by default inside the unit circle, or else with absolute value between r0 and r1
Jmat.Complex.random = function(r0, r1) {
  r0 = (r0 == undefined) ?  0 : r0;
  r1 = (r1 == undefined) ?  1 : r1;
  return Jmat.Complex.polar(Math.random() * (r1 - r0) + r0, Math.random() * Math.PI * 2);
};



////////////////////////////////////////////////////////////////////////////////
/** @license
License of Jmat.Complex.kiss_fft_ (converted from C to JavaScript):
Kiss FFT
Copyright (c) 2003-2010, Mark Borgerding
All rights reserved.
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the author nor the names of any contributors may be used to endorse or promote products derived from this software without specific prior written permission.
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
Jmat.Complex.kiss_fft_ = function(fin/*Jmat.Complex array of size nfft*/, fout/*Jmat.Complex array of size nfft*/, inverse) {
  // Constructor
  var KissFFTState = function(nfft, inverse) {
    this.nfft = nfft;
    this.inverse = inverse;
    this.factors = []; //int array, size 32
    this.twiddles = []; //complex Jmat.Complex array, size nfft-1
  };
  var kf_bfly2_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, fstride /*int*/, st /*kiss_fft_state*/, m /*int*/) {
    var j = 0;
    for(var i = 0; i < m; i++) {
      var t = Fout[Fout_index + i + m].mul(st.twiddles[j]);
      j += fstride;
      Fout[Fout_index + i + m] = Fout[Fout_index + i].sub(t);
      Fout[Fout_index + i] = Fout[Fout_index + i].add(t);
    }
  };
  var kf_bfly4_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, fstride /*int*/, st /*kiss_fft_state*/, m /*int*/) {
    var scratch = []; //size 6
    var m2=2*m;
    var m3=3*m;
    var j1 = 0;
    var j2 = 0;
    var j3 = 0;
    for(var i = 0; i < m; i++) {
      scratch[0] = Fout[Fout_index + i + m].mul(st.twiddles[j1]);
      scratch[1] = Fout[Fout_index + i + m2].mul(st.twiddles[j2]);
      scratch[2] = Fout[Fout_index + i + m3].mul(st.twiddles[j3]);
      scratch[5] = Fout[Fout_index + i].sub(scratch[1]);
      Fout[Fout_index + i] = Fout[Fout_index + i].add(scratch[1]);
      scratch[3] = scratch[0].add(scratch[2]);
      scratch[4] = scratch[0].sub(scratch[2]);
      Fout[Fout_index + i + m2] = Fout[Fout_index + i].sub(scratch[3]);
      j1 += fstride;
      j2 += fstride*2;
      j3 += fstride*3;
      Fout[Fout_index + i] = Fout[Fout_index + i].add(scratch[3]);
      if(st.inverse) {
        Fout[Fout_index + i + m].re = scratch[5].re - scratch[4].im;
        Fout[Fout_index + i + m].im = scratch[5].im + scratch[4].re;
        Fout[Fout_index + i + m3].re = scratch[5].re + scratch[4].im;
        Fout[Fout_index + i + m3].im = scratch[5].im - scratch[4].re;
      } else {
        Fout[Fout_index + i + m].re = scratch[5].re + scratch[4].im;
        Fout[Fout_index + i + m].im = scratch[5].im - scratch[4].re;
        Fout[Fout_index + i + m3].re = scratch[5].re - scratch[4].im;
        Fout[Fout_index + i + m3].im = scratch[5].im + scratch[4].re;
      }
    }
  };
  var kf_bfly3_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, fstride /*int*/, st /*kiss_fft_state*/, m /*int*/) {
    var k=m;
    var m2 = 2*m;
    var j1 = 0;
    var j2 = 0;
    var scratch = [];
    var epi3 = st.twiddles[fstride*m];
    for(var i = 0; i < k; i++) {
      scratch[1]=Fout[Fout_index + i+m].mul(st.twiddles[j1]);
      scratch[2]=Fout[Fout_index + i+m2].mul(st.twiddles[j2]);
      scratch[3]=scratch[1].add(scratch[2]);
      scratch[0]=scratch[1].sub(scratch[2]);
      j1 += fstride;
      j2 += fstride*2;
      Fout[Fout_index + i+m].re = Fout[Fout_index + i].re - scratch[3].re/2;
      Fout[Fout_index + i+m].im = Fout[Fout_index + i].im - scratch[3].im/2;
      scratch[0] = scratch[0].mulr(epi3.im);
      Fout[Fout_index + i] = Fout[Fout_index + i].add(scratch[3]);
      Fout[Fout_index + i+m2].re = Fout[Fout_index + i+m].re + scratch[0].im;
      Fout[Fout_index + i+m2].im = Fout[Fout_index + i+m].im - scratch[0].re;
      Fout[Fout_index + i+m].re -= scratch[0].im;
      Fout[Fout_index + i+m].im += scratch[0].re;
    }
  };
  var kf_bfly5_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, fstride /*int*/, st /*kiss_fft_state*/, m /*int*/) {
    var scratch = []; //size-13 complex array
    var ya = st.twiddles[fstride*m];
    var yb = st.twiddles[fstride*2*m];
    var m2 = 2 * m;
    var m3 = 3 * m;
    var m4 = 4 * m;
    for (var u=0; u<m; ++u ) {
      scratch[0] = Jmat.Complex(Fout[Fout_index + u]);
      scratch[1] = Fout[Fout_index + m+u].mul(st.twiddles[u*fstride]);
      scratch[2] = Fout[Fout_index + m2+u].mul(st.twiddles[2*u*fstride]);
      scratch[3] = Fout[Fout_index + m3+u].mul(st.twiddles[3*u*fstride]);
      scratch[4] = Fout[Fout_index + m4+u].mul(st.twiddles[4*u*fstride]);
      scratch[7] = scratch[1].add(scratch[4]);
      scratch[10]= scratch[1].sub(scratch[4]);
      scratch[8] = scratch[2].add(scratch[3]);
      scratch[9] = scratch[2].sub(scratch[3]);
      Fout[Fout_index + u].re += scratch[7].re + scratch[8].re;
      Fout[Fout_index + u].im += scratch[7].im + scratch[8].im;
      scratch[5] = Jmat.Complex(0);
      scratch[5].re = scratch[0].re + scratch[7].re*ya.re + scratch[8].re*yb.re;
      scratch[5].im = scratch[0].im + scratch[7].im*ya.re + scratch[8].im*yb.re;
      scratch[6] = Jmat.Complex(0);
      scratch[6].re = scratch[10].im*ya.im + scratch[9].im*yb.im;
      scratch[6].im = -scratch[10].re*ya.im - scratch[9].re*yb.im;
      Fout[Fout_index + m+u]=scratch[5].sub(scratch[6]);
      Fout[Fout_index + m4+u]=scratch[5].add(scratch[6]);
      scratch[11] = Jmat.Complex(0);
      scratch[11].re = scratch[0].re + scratch[7].re*yb.re + scratch[8].re*ya.re;
      scratch[11].im = scratch[0].im + scratch[7].im*yb.re + scratch[8].im*ya.re;
      scratch[12] = Jmat.Complex(0);
      scratch[12].re = -scratch[10].im*yb.im + scratch[9].im*ya.im;
      scratch[12].im = scratch[10].re*yb.im - scratch[9].re*ya.im;
      Fout[Fout_index + m2+u]=scratch[11].add(scratch[12]);
      Fout[Fout_index + m3+u]=scratch[11].sub(scratch[12]);
    }
  };
  // perform the butterfly for one stage of a mixed radix FFT
  var kf_bfly_generic_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, fstride /*int*/, st /*kiss_fft_state*/, m /*int*/, p /*int*/) {
    var u,k,q1,q; /*int*/
    var t; // complex Jmat.Complex
    var Norig = st.nfft;
    var scratch = [];
    for ( u=0; u<m; ++u ) {
      k=u;
      for ( q1=0 ; q1<p ; ++q1 ) {
        scratch[q1] = Jmat.Complex(Fout[Fout_index + k]);
        k += m;
      }
      k=u;
      for ( q1=0 ; q1<p ; ++q1 ) {
        var twidx=0;
        Fout[Fout_index + k] = scratch[0];
        for (q=1;q<p;++q ) {
          twidx += fstride * k;
          if (twidx>=Norig) twidx-=Norig;
          t = scratch[q].mul(st.twiddles[twidx] );
          Fout[Fout_index + k] = Fout[Fout_index + k].add(t);
        }
        k += m;
      }
    }
  };
  var kf_work_ = function(Fout /*array of complex Jmat.Complex*/, Fout_index, f /*array of complex Jmat.Complex*/,f_index,
      fstride /*int*/, in_stride /*int*/, factors /*int array*/, factors_index,st /*kiss_fft_state*/) {
    var p = factors[factors_index + 0]; /* the radix */
    var m = factors[factors_index + 1]; /* stage's fft length/p */
    var j = 0;

    if (m==1) {
      for(var i = 0; i < p*m; i++) {
        Fout[i + Fout_index] = Jmat.Complex(f[f_index + j]);
        j += fstride*in_stride;
      }
    }else{
      for(var i = 0; i < p*m; i += m) {
        // recursive call:
        // DFT of size m*p performed by doing p instances of smaller DFTs of size m, each one takes a decimated version of the input
        kf_work_(Fout, Fout_index + i, f, f_index + j, fstride*p, in_stride, factors, factors_index + 2, st);
        j += fstride*in_stride;
      }
    }
    // recombine the p smaller DFTs
    switch (p) {
      case 2: kf_bfly2_(Fout,Fout_index,fstride,st,m); break;
      case 3: kf_bfly3_(Fout,Fout_index,fstride,st,m); break;
      case 4: kf_bfly4_(Fout,Fout_index,fstride,st,m); break;
      case 5: kf_bfly5_(Fout,Fout_index,fstride,st,m); break;
      default: kf_bfly_generic_(Fout,Fout_index,fstride,st,m,p); break;
    }
  };
  // facbuf is populated by p1,m1,p2,m2, ... where p[i] * m[i] = m[i-1], m0 = n
  var kf_factor_ = function(n, facbuf) {
    var i = 0;
    var p=4;
    var floor_sqrt = Math.floor( Math.sqrt(n) );
    // factor out powers of 4, powers of 2, then any remaining primes
    do {
      while (n % p != 0) {
        switch (p) {
          case 4: p = 2; break;
          case 2: p = 3; break;
          default: p += 2; break;
        }
        if (p > floor_sqrt) p = n; // no more factors, skip to end
      }
      n = Math.floor(n / p);
      facbuf[i + 0] = p;
      facbuf[i + 1] = n;
      i += 2;
    } while (n > 1);
  };
  // returns kiss_fft_state object initialized for given size and inversion
  var kiss_fft_alloc_ = function(nfft,inverse_fft) {
    var st = new KissFFTState(nfft, inverse_fft);
    for (var i=0;i<nfft;++i) {
      var phase = -Math.PI*2*i / nfft;
      if (st.inverse) phase *= -1;
      st.twiddles[i] = new Jmat.Complex(Math.cos(phase), Math.sin(phase));
    }
    kf_factor_(nfft,st.factors);
    return st;
  };
  var kiss_fft_ = function(st/*kiss_fft_state object*/,fin/*complex Jmat.Complex array of size nfft*/,fout/*complex Jmat.Complex array of size nfft*/) {
    kf_work_(fout, 0, fin, 0, 1, 1/*in_stride*/, st.factors, 0, st);
  };
  var st = kiss_fft_alloc_(fin.length, inverse);
  kiss_fft_(st, fin, fout);
};
// End of Kiss FFT
////////////////////////////////////////////////////////////////////////////////

Jmat.Complex.fft = function(a, inverse) {
  var out = [];
  for(var i = 0; i < a.length; i++) out[i] = Jmat.Complex(0);
  Jmat.Complex.kiss_fft_(a, out, inverse);
  var factor = 1.0 / Math.sqrt(a.length);
  for(var i = 0; i < a.length; i++) out[i] = out[i].mulr(factor);
  return out;
};


/*
Jmat.js

Copyright (c) 2011-2016, Lode Vandevenne
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. The name of the author may not be used to endorse or promote products
   derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// REQUIRES: jmat_real.js, jmat_complex.js

/*
Jmat.Matrix: matrix and vector math

NOTE: Many routines assume an epsilon of 1e-15, considering values smaller than this to be zero
NOTE: There are also a few matrix algorithms in jmat_real.js. Those work on 2D arrays of real numbers,
      while here we work on a custom object with complex numbers.

Overview of some functionality:
-decompositions: Matrix.lu, Matrix.qr, Matrix.svd, Matrix.evd
-inverse: Matrix.inv, Matrix.pseudoinverse
-solve: Matrix.solve
-eigen: Matrix.eig, Matrix.eig11, Matrix.eig22
-fourier transform: Matrix.fft, Matrix.ifft
-vectors: Matrix.cross, Matrix.dot
-elementary operators: Matrix.add, Matrix.sub, Matrix.mul, Matrix.div, Matrix.leftdiv, Matrix.mulc, Matrix.mulr, ...
-special functions: Matrix.exp, Matrix.sin, Matrix.cos, Matrix.log, Matrix.sqrt, Matrix.powc
-matrix operators: Matrix.transpose, Matrix.conj, Matrix.tranjugate
-determinants and minors: Matrix.determinant, Matrix.minor, Matrix.cofactor, Matrix.adj
-norms and ranks: Matrix.norm, Matrix.maxrownorm, Matrix.maxcolnorm, Matrix.norm2, Matrix.conditionNumber, Matrix.rank, Matrix.trace
-tests: Matrix.isReal, Matrix.isNaN, Matrix.isInfOrNaN, Matrix.eq, Matrix.near
-constructors: Jmat.Matrix, Matrix.make, Matrix.parse, Matrix.cast, Matrix.copy, Matrix.identity, Matrix.zero
-pretty print: Matrix.render
*/

/*
Constructor, but also usable without new as factory function.

height first because that's the math convention: a 2x3 matrix is 2 rows high, 3 columns wide, and made as new Jmat.Matrix(2, 3).
Does not initialize elements if keyword "new" is in front. If keyword "new" is not in front, then uses Jmat.Matrix.make and all its options to initialize elements instead.

This is the actual object used as matrix. In addition, most of the matrix
functions are implemented as static functions in here.
*/
Jmat.Matrix = function(height, width, var_arg) {
  if(this instanceof Jmat.Matrix) {
    // Keyword "new" in front, use basic constructor
    this.h = height; //number of rows
    this.w = width; //number of columns
    this.e = []; //array of arrays. first index is row (y), second index is column (x)
    for(var y = 0; y < height; y++) {
      this.e[y] = []; // Make the rows available, but elements are NOT initialized. They must be initialized after using the "new" constructor.
    }
  } else {
    // No keyword "new" in front, use the convenience factory function instead
    return Jmat.Matrix.make.apply(this, arguments); // pass on the variable length arguments with apply. Note that "this" is not the Matrix here, but a browser Window or so.
  }
};

/*
Makes a matrix from many types of combinations of arguments
numerical values can either be JS numbers, or Jmat.Complex numbers
Here are all the combinations:

*) a = integer, b = integer: a*b matrix of _uninitialized_ elements (undefined, similar to the new Matrix constructor)
Jmat.Matrix(2, 2).toString()               --> [[undefined, undefined], [undefined, undefined]]

*) a = string: matrix parsed from string (if valid) - the string uses square brackets around the whole matrix and around each row, with rows and elements separated by commas.
Jmat.Matrix('[[1, 1e2], [3, 4i]]').toString()         --> [[1, 100], [3, 4i]]

*) a = 1D/2D array of numerical values: column vector or 2D matrix
Jmat.Matrix([[1, 2], [3, 4]]).toString()   --> [[1, 2], [3, 4]]: row [1, 2] and row [3, 4]
Jmat.Matrix([1, 2, 3, 4]).toString()       --> [[1],[2],[3],[4]]: a column matrix
Jmat.Matrix([[1, 2, 3, 4]]).toString()     --> [[1, 2, 3, 4]]: a row matrix
Jmat.Matrix([[Jmat.Complex(1, 5), Jmat.Complex(2, 6)], [Jmat.Complex(3, 7), Jmat.Complex(4, 8)]]).toString() --> [[1+5i, 2+6i], [3+7i, 4+8i]]

*) a = 1D/2D array or undefined, b = 1D/2D array: column vector or 2D matrix with complex values made from real parts of a, imaginary parts of b
Jmat.Matrix([[1, 2], [3, 4]], [[5, 6], [7, 8]]).toString() --> [[1+5i, 2+6i], [3+7i, 4+8i]]
Jmat.Matrix(undefined, [[1, 2], [3, 4]]).toString()        --> [[1i, 2i], [3i, 4i]]

*) a and b positive integers, var_arg = 1D array or implicit 1D array in arguments ...
**) ... with a*b elements: 2D matrix with elements from var_arg, height a, width b
Jmat.Matrix(2, 2, 1, 2, 3, 4).toString()   --> [[1, 2], [3, 4]]
**) ... with size of array == min(a,b), creates diagonal matrix from those elements
Jmat.Matrix(4, 4, 1, 2, 3, 4).toString()   --> [[1, 0, 0, 0], [0, 2, 0, 0], [0, 0, 3, 0], [0, 0, 0, 4]]: diagonal matrix
**) ... with size of array == 1, creates diagonal matrix with that one element repeated
Jmat.Matrix(3, 3, 0).toString()            --> [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
Jmat.Matrix(3, 3, 1).toString()            --> [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
**) ... with any other size: not allowed, returns invalid
Jmat.Matrix(3, 3, 1, 2)                    --> null

*) a = numerical value: 1x1 matrix with that element
Jmat.Matrix(0).toString()                  --> [0]

*) a = a Jmat.Matrix object: copy the matrix to a new Jmat.Matrix
Jmat.Matrix(Jmat.Matrix(0)).toString()     --> [0]
*/
Jmat.Matrix.make = function(a, b, var_arg) {
  if(!a) return new Jmat.Matrix(0, 0);
  if(a instanceof Jmat.Matrix) return Jmat.Matrix.copy(a);

  if(typeof a == 'string') return Jmat.Matrix.parse(a);

  // Tolerant to all kinds of nonexisting array
  // Also supports a 1D array representing an Nx1 2D array
  var softget = function(a, y, x) {
    return (a && a[y] != undefined) ? Jmat.Complex.cast(a[y][x] == undefined ? a[y] : a[y][x]) : Jmat.Complex();
  };
  var softgetr = function(a, y, x) {
    return (a && a[y] != undefined) ? Jmat.Real.cast(a[y][x] == undefined ? a[y] : a[y][x]) : 0;
  };
  var softget2 = function(a, b, y, x) {
    return new Jmat.Complex(softgetr(a, y, x), softgetr(b, y, x)); // real from a, imag from b
  };
  var arrayw = function(a) {
    if(!a || a[0] == undefined) return 0; // empty array
    if(a[0].length == undefined) return 1; // this means it's a 1D array, such array has width 1, not width 0
    return a[0].length;
  };
  // a is array, b is optional second array (only supported for shift == -1)
  // shift -1 ==> a is 2D array
  // shift >= 0 ==> a is 1D array of which the 2D elements are read, first element at a[shift]
  // shift >= 0 and a.length - shift is min(h, w) ==> makes diagonal matrix with those elements on the diagonal instead
  var loop = function(h, w, a, shift, opt_b) {
    var result;
    if(shift >= 0 && a.length < h * w) {
      result = Jmat.Matrix.zero(h, w);
      if(shift >= 0 && a.length - shift == 1) {
        // repeat same element on diagonal
        for(var x = 0; x < w && x < h; x++) {
          result.e[x][x] = Jmat.Complex.cast(a[shift]);
        }
        return result;
      }
      if(shift >= 0 && a.length - shift == Math.min(h, w)) {
        // fill diagonal
        for(var x = 0; x < w && x < h; x++) {
          result.e[x][x] = Jmat.Complex.cast(a[x + shift]);
        }
        return result;
      }
      return null; //invalid size
    }
    // full 2D matrix
    result = new Jmat.Matrix(h, w);
    for(var y = 0; y < result.h; y++) {
      for(var x = 0; x < result.w; x++) {
        if(shift < 0) result.e[y][x] = (opt_b ? softget2(a, opt_b, y, x) : softget(a, y, x));
        else result.e[y][x] = Jmat.Complex.cast(a[y * w + x + shift]);
      }
    }
    return result;
  };

  // one or two arrays, make all elements from them, size defined by the arrays
  if((("undefined" !== typeof a) && a.length) || (("undefined" !== typeof b) && b.length)) {
    var h = Math.max((a && a.length) || 0, (b && b.length) || 0);
    var w = Math.max(arrayw(a), arrayw(b));
    return loop(h, w, a, -1, b);
  }

  // single number or Jmat.Complex
  if(a != undefined && b == undefined) {
    var result = new Jmat.Matrix(1, 1);
    result.e[0][0] = Jmat.Complex.cast(a);
    return result;
  }

  // a and b contain dimensions, then elements in array or variable arguments
  if(a != undefined && b != undefined) {
    if(var_arg == undefined) return new Jmat.Matrix(a, b); // simple constructor with uninitialized elements
    var h = a;
    var w = b;
    if(var_arg && var_arg.length) return loop(h, w, var_arg, 0);
    return loop(h, w, arguments, 2); // use JS function arguments, shifted by 2 because the first two are a and b
  }

  return new Jmat.Matrix(0, 0);
};

//debugstring
Jmat.Matrix.toString = function(m, opt_precision) {
  // e.g in console: Jmat.Matrix.toString(getMatrixFromMem(Jmat.Complex(100))
  if(!m) return '' + m;
  var s = '[';
  for(var y = 0; y < m.h; y++) {
    s += '[';
    for(var x = 0; x < m.w; x++) {
      var e = m.e[y][x];
      s += Jmat.Complex.toString(e, opt_precision);
      if(x + 1 < m.w) s += ', ';
    }
    s += ']';
    if(y + 1 < m.h) s += ', ';
  }
  return s + ']';
};
Jmat.Matrix.prototype.toString = function(opt_precision) {
  return Jmat.Matrix.toString(this, opt_precision);
};

//similar to toString, but using curly braces instead of square brackets
Jmat.Matrix.toCurly = function(m, opt_precision) {
  return Jmat.Matrix.toString(m, opt_precision).replace(/\[/g, '{').replace(/\]/g, '}');
};
Jmat.Matrix.prototype.toCurly = function(opt_precision) {
  return Jmat.Matrix.toCurly(this, opt_precision);
};

//similar to toString, but using matlab/octave notation with semicolons
Jmat.Matrix.toSemi = function(m, opt_precision) {
  if(!m) return '' + m;
  var s = '[';
  for(var y = 0; y < m.h; y++) {
    for(var x = 0; x < m.w; x++) {
      var e = m.e[y][x];
      s += Jmat.Complex.toString(e, opt_precision);
      if(x + 1 < m.w) s += ' ';
    }
    if(y + 1 < m.h) s += '; ';
  }
  return s + ']';
};
Jmat.Matrix.prototype.toSemi = function(opt_precision) {
  return Jmat.Matrix.toSemi(this, opt_precision);
};

Jmat.Matrix.parse = function(text) {
  var e = [];
  var stack = [e];
  var text2 = '';
  for(var i = 1; i < text.length - 1 && stack.length > 0; i++) {
    var c = text.charAt(i);
    if(c == '[') {
      var a = [];
      stack[stack.length - 1].push(a);
      stack.push(a);
    } else if(c == ']') {
      if(text2 != '') {
        stack[stack.length - 1].push(Jmat.Complex.parse(text2));
        text2 = '';
      }
      stack.pop();
    } else if(c == ',') {
      if(text2 != '') {
        stack[stack.length - 1].push(Jmat.Complex.parse(text2));
        text2 = '';
      }
    } else {
      text2 += c;
    }
  }
  if(text2 != '') stack[stack.length - 1].push(Jmat.Complex.parse(text2));
  return Jmat.Matrix.make(e);
};

// Makes ascii art rendering of the matrix (requires fixed width font)
Jmat.Matrix.render = function(a, opt_precision) {
  if(!a) return '' + a; // e.g. 'null'
  //turn undefined into nan
  if (!Jmat.Matrix.isValid(a)) {
    a = Jmat.Matrix.copy(a);
    for (var y = 0; y < a.h; y++) {
      for (var x = 0; x < a.w; x++) {
        if(!a.e[y][x]) a.e[y][x] = Jmat.Complex(NaN);
      }
    }
  }
  opt_precision = opt_precision == undefined ? (Jmat.Matrix.isInteger(a) ? 0 : 3) : opt_precision;
  var result = '';
  var real = Jmat.Matrix.isReal(a);
  var strings = [];
  var longest = [];
  for (var y = 0; y < a.h; y++) {
    strings.push([]);
    for (var x = 0; x < a.w; x++) {
      if(y == 0) longest.push([0, 0]);
      var s = [a.e[y][x].re.toFixed(opt_precision), Math.abs(a.e[y][x].im).toFixed(opt_precision)];
      longest[x] = [Math.max(s[0].length, longest[x][0]), Math.max(s[1].length, longest[x][1])];
      strings[y].push(s);
    }
  }
  for (var y = 0; y < a.h; y++) {
    var line = '';
    line += '|' + (y + 1 == a.h ? '_' : ' ');
    for (var x = 0; x < a.w; x++) {
      var s = strings[y][x][0];
      while (s.length < longest[x][0]) s = ' ' + s;
      if (!real) {
        var neg = a.e[y][x].im < 0;
        var t = strings[y][x][1];
        while (t.length < longest[x][1]) t = '0' + t;
        t = (neg ? '-' : '+') + t;
        s += t + 'i';
      }

      line += s + ((y + 1 == a.h && x + 1 == a.w) ? '_' : ' ');
    }
    line += '|';
    if(y == 0) {
      var top = ' _';
      while(top.length + 2 < line.length) top += ' ';
      top += '_';
      result += top + '\n';
    }
    result += line + '\n';
  }
  return result;
};
Jmat.Matrix.prototype.render = function(opt_precision) {
  return Jmat.Matrix.render(this, opt_precision);
};


// Does not copy if a is of type Jmat.Matrix.
Jmat.Matrix.cast = function(a) {
  return a instanceof Jmat.Matrix ? a : Jmat.Matrix.make(a);
};

//aka clone
Jmat.Matrix.copy = function(a) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if (!a.e[y][x]) result.e[y][x] = a.e[y][x]; //null or undefined...
      else result.e[y][x] = Jmat.Complex(a.e[y][x].re, a.e[y][x].im);
    }
  }
  return result;
};

// Returns new h*w identity matrix. AKA "eye".
Jmat.Matrix.identity = function(h, opt_w) {
  var w = opt_w || h;
  var r = new Jmat.Matrix(h, w);
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      r.e[y][x] = Jmat.Complex(x == y ? 1 : 0);
    }
  }
  return r;
};

// Returns new h*w zero matrix
Jmat.Matrix.zero = function(h, opt_w) {
  var w = opt_w || h;
  var r = new Jmat.Matrix(h, w);
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      r.e[y][x] = Jmat.Complex(0);
    }
  }
  return r;
};

////////////////////////////////////////////////////////////////////////////////

Jmat.Matrix.add = function(a, b) {
  if(a.w != b.w || a.h != b.h) return null;
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].add(b.e[y][x]);
    }
  }
  return result;
};
Jmat.Matrix.prototype.add = function(b) {
  return Jmat.Matrix.add(this, b);
};

Jmat.Matrix.sub = function(a, b) {
  if(a.w != b.w || a.h != b.h) return null;
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].sub(b.e[y][x]);
    }
  }
  return result;
};
Jmat.Matrix.prototype.sub = function(b) {
  return Jmat.Matrix.sub(this, b);
};

// the iterative O(n^3) multiplication algorithm
Jmat.Matrix.n3mul_ = function(a, b) {
  if(a.w != b.h) return null;
  var result = new Jmat.Matrix(a.h, b.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var e = Jmat.Complex(0);
      for(var z = 0; z < a.w; z++) e = e.add(a.e[y][z].mul(b.e[z][x]));
      result.e[y][x] = e;
    }
  }
  return result;
};

// the iterative O(n^3) multiplication algorithm
// slow version without cache optimization, left for reference and comparison
Jmat.Matrix.n3mul_nocache_ = function(a, b) {
  if(a.w != b.h) return null; // mathematically invalid
  var result = new Jmat.Matrix(a.h, b.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var e = Jmat.Complex(0);
      for(var z = 0; z < a.w; z++) e = e.add(a.e[y][z].mul(b.e[z][x]));
      result.e[y][x] = e;
    }
  }
  return result;
};

// the iterative O(n^3) multiplication algorithm
Jmat.Matrix.n3mul_ = function(a, b) {
  if(a.w != b.h) return null; // mathematically invalid
  var result = new Jmat.Matrix(a.h, b.w);
  var temp = [];
  for (var x = 0; x < b.w; x++) {
    for (var z = 0; z < a.w; z++) temp[z] = b.e[z][x]; // copy for better caching (faster)
    for (var y = 0; y < a.h; y++) {
      var e = Jmat.Complex(0);
      for (var z = 0; z < a.w; z++) e = e.add(a.e[y][z].mul(temp[z]));
      result.e[y][x] = e;
    }
  }
  return result;
};

// Strassen matrix multiplication algorithm
// Measurably faster in JS for 400x400 matrices and higher
Jmat.Matrix.strassen_ = function(a, b) {
  var M = Jmat.Matrix;
  if(a.w != b.h) return null; // mathematically invalid
  if(a.w < 2 || a.h < 2 || b.w < 2) return M.n3mul_(a, b); // doesn't support smaller size than that

  var n = Math.min(a.h, Math.min(a.w, b.w));
  if(n & 1) n--; // we need even size

  var n2 = Math.floor(n / 2);

  var a00 = M.submatrix(a, 0, n2, 0, n2);
  var a01 = M.submatrix(a, 0, n2, n2, n2 * 2);
  var a10 = M.submatrix(a, n2, n2 * 2, 0, n2);
  var a11 = M.submatrix(a, n2, n2 * 2, n2, n2 * 2);
  var b00 = M.submatrix(b, 0, n2, 0, n2);
  var b01 = M.submatrix(b, 0, n2, n2, n2 * 2);
  var b10 = M.submatrix(b, n2, n2 * 2, 0, n2);
  var b11 = M.submatrix(b, n2, n2 * 2, n2, n2 * 2);

  var m0 = (a00.add(a11)).mul(b00.add(b11));
  var m1 = (a10.add(a11)).mul(b00);
  var m2 = a00.mul(b01.sub(b11));
  var m3 = a11.mul(b10.sub(b00));
  var m4 = (a00.add(a01)).mul(b11);
  var m5 = (a10.sub(a00)).mul(b00.add(b01));
  var m6 = (a01.sub(a11)).mul(b10.add(b11));

  var c00 = m0.add(m3).sub(m4).add(m6); // instead of: a00.mul(b00).add(a01.mul(b10));
  var c01 = m2.add(m4);                 // instead of: a00.mul(b01).add(a01.mul(b11));
  var c10 = m1.add(m3);                 // instead of: a10.mul(b00).add(a11.mul(b10));
  var c11 = m0.sub(m1).add(m2).add(m5); // instead of: a10.mul(b01).add(a11.mul(b11));

  var c = M(a.h, b.w);
  M.insertInPlace(c, c00, 0, 0);
  M.insertInPlace(c, c01, 0, c00.w);
  M.insertInPlace(c, c10, c00.h, 0);
  M.insertInPlace(c, c11, c00.h, c00.w);

  // fix dynamic peeling. TODO: this means it's as slow as the n^3 algorithm for parts of very non-square matrices. Implement smarter solution.
  if(n != a.w || n != a.h || n != b.w) {
    var temp = [];
    for (var x = 0; x < b.w; x++) {
      for (var z = 0; z < a.w; z++) temp[z] = b.e[z][x]; // copy for better caching (faster)
      for (var y = 0; y < a.h; y++) {
        var e = Jmat.Complex(0);
        var z0 = 0;
        if(x < n && y < n) z0 = n;
        else c.e[y][x] = Jmat.Complex(0);
        for (var z = z0; z < a.w; z++) e = e.add(a.e[y][z].mul(temp[z]));
        c.e[y][x] = c.e[y][x].add(e);
      }
    }
  }

  return c;
};

Jmat.Matrix.mul = function(a, b) {
  var m = Math.min(a.w, Math.min(a.h, b.w));
  if(m < 350) return Jmat.Matrix.n3mul_(a, b);
  return Jmat.Matrix.strassen_(a, b);
};
Jmat.Matrix.prototype.mul = function(b) {
  return Jmat.Matrix.mul(this, b);
};

// mulScalar (c from complex number)
Jmat.Matrix.mulc = function(a, s) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].mul(s);
    }
  }
  return result;
};
Jmat.Matrix.prototype.mulc = function(s) {
  return Jmat.Matrix.mulc(this, s);
};

Jmat.Matrix.mulr = function(a, s) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].mulr(s);
    }
  }
  return result;
};
Jmat.Matrix.prototype.mulr = function(s) {
  return Jmat.Matrix.mulr(this, s);
};

//hadamard product: element-wise product
Jmat.Matrix.elmul = function(a, b) {
  if(a.w != b.w || a.h != b.h) return null;
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].mul(b.e[y][x]);
    }
  }
  return result;
};

// returns a/b = a * b^-1
// In other words, "divides" matrix through matrix
Jmat.Matrix.div = function(a, b) {
  if(a.w != b.h) return null;
  var result = new Jmat.Matrix(a.h, b.w);

  b = Jmat.Matrix.inv(b); //TODO: use pseudo inverse?

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var e = Jmat.Complex(0);
      for(var z = 0; z < a.w; z++) e = e.add(a.e[y][z].mul(b.e[z][x]));
      result.e[y][x] = e;
    }
  }
  return result;
};
Jmat.Matrix.prototype.div = function(b) {
  return Jmat.Matrix.div(this, b);
};

//element-wise division
Jmat.Matrix.eldiv = function(a, b) {
  if(a.w != b.w || a.h != b.h) return null;
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].div(b.e[y][x]);
    }
  }
  return result;
};

// returns a/b = b^-1 * a
Jmat.Matrix.leftdiv = function(a, b) {
  if(a.w != b.h) return null;
  var result = new Jmat.Matrix(a.h, b.w);

  b = Jmat.Matrix.inv(b); //TODO: use pseudo inverse?

  for(var y = 0; y < b.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = Jmat.Complex(0);
      for(var z = 0; z < b.w; z++) e = e.add(b.e[y][z].mul(a.e[z][x]));
      result.e[y][x] = e;
    }
  }
  return result;
};
Jmat.Matrix.prototype.leftdiv = function(b) {
  return Jmat.Matrix.leftdiv(this, b);
};

// Divide through complex scalar
Jmat.Matrix.divc = function(a, s) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].div(s);
    }
  }
  return result;
};
Jmat.Matrix.prototype.divc = function(s) {
  return Jmat.Matrix.divc(this, s);
};

// divide through real scalar (JS number)
Jmat.Matrix.divr = function(a, s) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].divr(s);
    }
  }
  return result;
};
Jmat.Matrix.prototype.divr = function(s) {
  return Jmat.Matrix.divr(this, s);
};

////////////////////////////////////////////////////////////////////////////////
// Categories and Properties
////////////////////////////////////////////////////////////////////////////////

Jmat.Matrix.isReal = function(a) {
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = a.e[y][x];
      if(e.im != 0) return false;
    }
  }
  return true;
};

//valid object, no infinities, no NaN elements
Jmat.Matrix.isValid = function(a) {
  if(!a || !a.w || !a.h || !a.e || !a.e.length) return false;
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = a.e[y][x];
      if(e) {
        if(e.re == Infinity || e.re == -Infinity || e.re != e.re) return false;
        if(e.im == Infinity || e.im == -Infinity || e.im != e.im) return false;
      } else {
        return false;
      }
    }
  }
  return true;
};

//returns true if any NaN in matrix. For the rest, must be valid object.
Jmat.Matrix.isNaN = function(a) {
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if(Jmat.Complex.isNaN(a.e[y][x])) return true;
    }
  }
  return false;
};

//returns true if any infinity or NaN in matrix. For the rest, must be valid object.
Jmat.Matrix.isInfOrNaN = function(a) {
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if(Jmat.Complex.isInfOrNaN(a.e[y][x])) return true;
    }
  }
  return false;
};

////////////////////////////////////////////////////////////////////////////////

Jmat.Matrix.isSquare = function(a) {
  return a.w == a.h;
};

// Singular matrix: square matrix with determinant zero.
// Other properties: non-invertible, rows or colums linearly dependent, ...
Jmat.Matrix.isSingular = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  var c = Jmat.Matrix.conditionNumber(a);
  // >= is used, not >, so that if epsilon is 0 and c is Infinity, it correctly returns 'true' since c is Infinity for a numerically exact singular matrix.
  return Jmat.Matrix.isSquare(a) && c.abs() >= 1 / epsilon;
};

// Invertible matrix: square matrix with determinant non-zero. AKA Non-singular.
Jmat.Matrix.isInvertible = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  return Jmat.Matrix.isSquare(a) && !Jmat.Matrix.isSingular(a, epsilon);
};

Jmat.Matrix.isIdentity = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = (x == y) ? 1 : 0;
      if (!Jmat.Complex.nearr(a.e[y][x], e, epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isDiagonal = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if (x == y) continue;
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isZero = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

// Equal to its transpose
Jmat.Matrix.isSymmetric = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y + 1; x < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], a.e[x][y], epsilon)) return false;
    }
  }
  return true;
};

// Equal to its transjugate, complex equivalent of symmetric
// Diagonal elements must be real as they have to be their own complex conjugate
Jmat.Matrix.isHermitian = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y; x < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], Jmat.Complex.conj(a.e[x][y]), epsilon)) return false;
    }
  }
  return true;
};

// Equal to negative of its transpose
// Diagonal elements must be zero as they have to be their own negative
Jmat.Matrix.isSkewSymmetric = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y; x < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], Jmat.Complex.neg(a.e[x][y]), epsilon)) return false;
    }
  }
  return true;
};

// AKA anti-hermitian
Jmat.Matrix.isSkewHermitian = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y; x < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], Jmat.Complex.conj(a.e[x][y]).neg(), epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isUpperTriangular = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < y; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isLowerTriangular = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y + 1; x < a.w; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isStrictlyUpperTriangular = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x <= y; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

Jmat.Matrix.isStrictlyLowerTriangular = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y; x < a.w; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

// almost triangular: elements right below the diagonal are also allowed to be non-zero
Jmat.Matrix.isUpperHessenberg = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x + 1 < y; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

// almost triangular: elements right above the diagonal are also allowed to be non-zero
Jmat.Matrix.isLowerHessenberg = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = y + 2; x < a.w; x++) {
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

// both upper and lower hessenberg
Jmat.Matrix.isTridiagonal = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if (x == y || x + 1 == y || x == y + 1) continue;
      if (!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
    }
  }
  return true;
};

// A*A^T == I, for real A (isUnitary is the complex equivelent). Its transpose is its inverse, and the vectors form an orthonormal basis.
Jmat.Matrix.isOrthogonal = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;
  //if (!Jmat.Matrix.isReal(a)) return false; // Not sure if to be strict with this check or not...

  var aa = a.mul(a.transpose());
  return Jmat.Matrix.isIdentity(aa, epsilon);
};

// A*A^(*) == I
Jmat.Matrix.isUnitary = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  var aa = a.mul(a.transjugate());
  return Jmat.Matrix.isIdentity(aa, epsilon);
};

// Normal matrix: A * A^(*) == A^(*) * A
Jmat.Matrix.isNormal = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  var at = a.transjugate();
  return Jmat.Matrix.near(a.mul(at), at.mul(a), epsilon);
};

// Permutation matrix: binary, exactly one 1 on each row and column
Jmat.Matrix.isPermutation = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y < a.h; y++) {
    var num0 = 0;
    var num1 = 0;
    var numx = 0;
    for(var x = 0; x < a.w; x++) {
      if(!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) num0++;
      else if(!Jmat.Complex.nearr(a.e[y][x], 1, epsilon)) num1++;
      else numx++;
    }
    if (num1 != 1 || numx > 0) return false;
  }

  for(var x = 0; x < a.w; x++) {
    var num0 = 0;
    var num1 = 0;
    var numx = 0;
    for(var y = 0; y < a.h; y++) {
      if(!Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) num0++;
      else if(!Jmat.Complex.nearr(a.e[y][x], 1, epsilon)) num1++;
      else numx++;
    }
    if (num1 != 1 || numx > 0) return false;
  }

  return true;
};

// constant elements along diagonals
Jmat.Matrix.isToeplitz = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 0; y + 1 < a.h; y++) {
    for(var x = 0; x + 1 < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], a.e[y + 1][x + 1], epsilon)) return false;
    }
  }
  return true;
};

// constant elements along anti-diagonals
Jmat.Matrix.isHankel = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  for(var y = 1; y < a.h; y++) {
    for(var x = 0; x + 1 < a.w; x++) {
      if (!Jmat.Complex.near(a.e[y][x], a.e[y - 1][x + 1], epsilon)) return false;
    }
  }
  return true;
};

// like identity except one column may have arbitrary elements below the diagonal
Jmat.Matrix.isFrobenius = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!Jmat.Matrix.isSquare(a)) return false;

  var col = -1; //the one column that non-zero elements below the diagonal

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if (x == y && !Jmat.Complex.nearr(a.e[y][x], 1, epsilon)) return false;
      if (x > y && !Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) return false;
      if (x < y && !Jmat.Complex.nearr(a.e[y][x], 0, epsilon)) {
        if(col >= 0 && x != col) return false;
        col = x;
      }
    }
  }
  return true;
};

Jmat.Matrix.isInteger = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = a.e[y][x];
      if(!Jmat.Real.near(e.im, 0, epsilon)) return false;
      if(Math.abs(Math.round(e.re) - e.re) > epsilon) return false;
    }
  }
  return true;
};

// only 0's and 1's
Jmat.Matrix.isBinary = function(a, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var e = a.e[y][x];
      if(!Jmat.Real.near(e, 0, epsilon) && !Jmat.Real.near(e, 1, epsilon)) return false;
    }
  }
  return true;
};

// Involutory matrix: its own inverse, A*A = I
Jmat.Matrix.isInvolutory = function(a, opt_epsilon) {
  if (!Jmat.Matrix.isSquare(a)) return false;
  return Jmat.Matrix.isIdentity(a.mul(a), opt_epsilon);
};

// Idempotent matrix: A*A = A
Jmat.Matrix.isIdempotent = function(a, opt_epsilon) {
  if (!Jmat.Matrix.isSquare(a)) return false;
  return Jmat.Matrix.near(a, a.mul(a), opt_epsilon);
};

// Nilpotent matrix: A^k = 0 for some positive integer k. May require up to log(n) multiplications, so N^3*log(N) worse complexity but usually much faster due to fast early checks.
Jmat.Matrix.isNilpotent = function(a, opt_epsilon) {
  var M = Jmat.Matrix;
  var epsilon = (opt_epsilon == undefined) ? 1e-15 : opt_epsilon;
  if (!M.isSquare(a)) return false;
  var n = a.w;
  var k = 1;
  for(;;) {
    if(!M.trace(a).eqr(0, epsilon)) return false; // the trace must always be zero, so this is a fast check to quit early
    if(M.isZero(a, epsilon)) return true;
    if(k >= n) break; // it is known that k is <= n, so we can stop checking once over that
    a = a.mul(a);
    k *= 2;
  }
  return false;
};

// Returns an object with various named boolean and scalar properties of the given matrix
// TODO: add parameter to only return fast to calculate properties, max N^2 complexity (so no determinant, svd based condition number, rank, definiteness, ...)
Jmat.Matrix.getProperties = function(a) {
  var M = Jmat.Matrix;
  var result = {};

  result['dimensions'] = '' + a.h + 'x' + a.w;
  result['height'] = a.h;
  result['width'] = a.w;
  result['square'] = M.isSquare(a);
  result['zero'] = M.isZero(a);
  result['real'] = M.isReal(a);
  result['rank'] = M.rank(a);
  result['frobeniusNorm'] = M.norm(a);
  result['spectralNorm'] = M.norm2(a);
  result['conditionNumber'] = M.conditionNumber(a);
  result['NaN'] = M.isNaN(a);

  // The following properties only make sense for square matrices
  result['identity'] = M.isIdentity(a);
  result['diagonal'] = M.isDiagonal(a);
  result['tridiagonal'] = M.isTridiagonal(a);
  result['symmetric'] = M.isSymmetric(a);
  result['hermitian'] = M.isHermitian(a);
  result['skewHermitian'] = M.isSkewHermitian(a);
  result['skewSymmetric'] = M.isSkewSymmetric(a);
  result['upperTriangular'] = M.isUpperTriangular(a);
  result['lowerTriangular'] = M.isLowerTriangular(a);
  result['strictlyUpperTriangular'] = M.isStrictlyUpperTriangular(a);
  result['strictlyLowerTriangular'] = M.isStrictlyLowerTriangular(a);
  result['upperHessenberg'] = M.isUpperHessenberg(a);
  result['lowerHessenberg'] = M.isLowerHessenberg(a);
  result['singular'] = M.isSingular(a);
  result['invertible'] = M.isInvertible(a);
  result['determinant'] = M.determinant(a);
  result['trace'] = M.trace(a);
  result['orthogonal'] = M.isOrthogonal(a);
  result['unitary'] = M.isUnitary(a);
  result['normal'] = M.isNormal(a);
  result['permutation'] = M.isPermutation(a);
  result['toeplitz'] = M.isToeplitz(a);
  result['hankel'] = M.isHankel(a);
  result['frobenius'] = M.isFrobenius(a);
  result['integer'] = M.isInteger(a);
  result['binary'] = M.isBinary(a);
  result['involutory'] = M.isInvolutory(a);
  result['idempotent'] = M.isIdempotent(a);
  if(result['hermitian']) {
    var d = M.definiteness(a);
    if(d == M.INDEFINITE) result['indefinite'] = true;
    else if(d == M.POSITIVE_DEFINITE) result['positiveDefinite'] = result['positiveSemidefinite'] = true;
    else if(d == M.NEGATIVE_DEFINITE) result['negativeDefinite'] = result['negativeSemidefinite'] = true;
    else if(d == M.POSITIVE_SEMI_DEFINITE || result['zero']) result['positiveSemidefinite'] = true;
    else if(d == M.NEGATIVE_SEMI_DEFINITE || result['zero']) result['negativeSemidefinite'] = true;
  }

  return result;
};

// Gives a one-sentence summary of some interesting properites of the matrix. The more properties the matrix has, the longer the sentence (e.g. if it's square more properties appear, ...)
// Does not show redundant properties. E.g. if the matrix is 'identity', will not show 'symmetric', if it's 'normal', will not show 'orthogonal', etc...
// To see every single property instead, do "Jmat.toString(Jmat.Matrix.getProperties(a))"
Jmat.Matrix.summary = function(a) {
  var p = Jmat.Matrix.getProperties(a);

  var toName = function(name) {
    // convert camelCase to lower case with spaces
    if(name != 'NaN') name = name.replace(/([A-Z])/g, ' $1').toLowerCase();
    // But keep own names
    name = name.replace('hessenberg', 'Hessenberg');
    name = name.replace('frobenius', 'Frobenius');
    name = name.replace('toeplitz', 'Toeplitz');
    name = name.replace('hankel', 'Hankel');
    name = name.replace('frobenius', 'Frobenius');
    return name;
  };

  //order of non-square related properties
  var nonsquare = ['height', 'width', 'zero', 'real', 'NaN',
                   'rank', 'frobeniusNorm', 'spectralNorm', 'conditionNumber', 'integer', 'binary'];
  //order of properties only applicable for square matrices
  var square = ['identity', 'symmetric', 'hermitian', 'skewSymmetric', 'skewHermitian', 'diagonal', 'tridiagonal',
                'upperTriangular', 'lowerTriangular', 'strictlyUpperTriangular', 'strictlyLowerTriangular', 'upperHessenberg', 'lowerHessenberg',
                'singular', 'invertible', 'determinant', 'trace', 'orthogonal', 'unitary', 'normal', 'permutation', 'toeplitz', 'hankel',
                'indefinite', 'positiveDefinite', 'negativeDefinite', 'positiveSemidefinite', 'negativeSemidefinite', 'frobenius', 'involutory', 'idempotent'];

  var opposite = { 'square' : 'non-square', 'real' : 'complex' };
  // these properties are added only to avoid some redundancy in summary output with the "sub" sytem
  p['small2x2'] = (a.w <= 2 && a.h <= 2);
  p['small1x1'] = (a.w <= 1 && a.h <= 1);
  p['realsym'] = p['real'] && p['symmetric'];
  p['realskewsym'] = p['real'] && p['skewSymmetric'];
  // pairs of child:parents, where child is always true if any of the parents is true, with the intention to not display child in a list if parent is already true as it's redundant
  var sub = {
    'strictlyUpperTriangular': ['zero'], 'strictlyLowerTriangular' : ['zero'],
    'upperTriangular' : ['diagonal', 'strictlyUpperTriangular'], 'lowerTriangular' : ['diagonal', 'frobenius', 'strictlyLowerTriangular'],
    'upperHessenberg' : ['upperTriangular', 'tridiagonal'], 'lowerHessenberg' : ['lowerTriangular', 'tridiagonal'],
    'diagonal' : ['small1x1', 'identity', 'zero'], 'tridiagonal' : ['small2x2', 'diagonal'],
    'orthogonal' : ['normal', 'identity'], 'unitary' : ['normal'], 'normal' : ['identity', 'zero'],
    'hermitian' : ['normal', 'realsym'],  'skewHermitian' : ['realskewsym'],
    'symmetric' : ['diagonal'], 'skewSymmetric' : ['zero'],
    'permutation' : ['identity'], 'invertible' : ['identity'], 'singular' : ['zero'],
    'real' : ['integer'], 'toeplitz' : ['identity', 'zero'], 'hankel' : ['zero'], 'frobenius' : ['identity'],
    'positiveDefinite' : ['identity'], 'negativeSemidefinite' : ['zero', 'negativeDefinite'], 'positiveSemidefinite' : ['zero', 'positiveDefinite'],
    'integer': ['binary'], 'binary': ['identity', 'zero'], 'involutory': ['identity'], 'idempotent': ['identity']
  };

  var summary = p['dimensions'] + ', ' + (p['square'] ? 'square' : opposite['square']);
  for(var i = 0; i < nonsquare.length + square.length; i++) {
    var e = i < nonsquare.length ? nonsquare[i] : square[i - nonsquare.length];
    if (p[e] === true) {
      if (sub[e]) {
        var redundant = false;
        for(var j = 0; j < sub[e].length; j++) if(p[sub[e][j]] === true) redundant = true; //e.g. don't say "upper triangular" if it's already "strictly upper triangular"
        if(redundant) continue;
      }
      summary += ', ' + toName(e);
    }
    if (p[e] === false && opposite[e]) {
      summary += ', ' + toName(opposite[e]);
    }
  }
  var det = p['square'] ? (', determinant ' + p['determinant']) : '';
  summary = '' + summary + ' matrix with rank ' + p['rank'] + det + ' and condition number ' + p['conditionNumber'] + '.\n';

  return summary;
};
Jmat.Matrix.prototype.summary = function() {
  return Jmat.Matrix.summary(this);
};

// render() followed by summary()
Jmat.Matrix.render_summary = function(a) {
  return a.render() + '\n' + a.summary();
};
Jmat.Matrix.prototype.render_summary = function() {
  return Jmat.Matrix.render_summary(this);
};

// TODO: functions like isSymmetric, isHermitian, isDiagonal, ...

////////////////////////////////////////////////////////////////////////////////

Jmat.Matrix.transpose = function(a) {
  var result = new Jmat.Matrix(a.w, a.h); //arguments inverted (ctor takes height first)

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[x][y] = a.e[y][x];
    }
  }
  return result;
};
Jmat.Matrix.prototype.transpose = function() {
  return Jmat.Matrix.transpose(this);
};

Jmat.Matrix.neg = function(a) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = a.e[y][x].neg();
    }
  }
  return result;
};
Jmat.Matrix.prototype.neg = function() {
  return Jmat.Matrix.neg(this);
};

Jmat.Matrix.conj = function(a) {
  var result = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result.e[y][x] = Jmat.Complex.conj(a.e[y][x]);
    }
  }
  return result;
};
Jmat.Matrix.prototype.conj = function() {
  return Jmat.Matrix.conj(this);
};

//transjugate = transposed conjugate, denoted A^* or A^H (also called hermitian transpose or conjugate transpose)
Jmat.Matrix.transjugate = function(a) {
  return Jmat.Matrix.conj(Jmat.Matrix.transpose(a));
};
Jmat.Matrix.prototype.transjugate = function() {
  return Jmat.Matrix.transjugate(this);
};

// Internal algorithm for lu.
// Returns L and U merged into one matrix (without L's diagonal 1's), a pivot array (permutation) with element i the pivot row interchanged with row i, and the parity (0 or 1) of the permutation.
// TODO: usually the permutation format of this function is what you want, not the matrix that lu() returns, so make this public in some way
// TODO: support rectangular matrices
Jmat.Matrix.doolittle_lup_ = function(a) {
  if(a.h != a.w) return null; //must be square
  var M = Jmat.Matrix;
  var C = Jmat.Complex;
  a = M.copy(a); // we'll modify it to interchange rows and insert elements from L and U

  var pivot = [];
  var parity = 0;

  for(var k = 0; k < a.h; k++)
  {
    var y = k;
    var max = a.e[y][k].abs();
    for(var i = k + 1; i < a.h; i++) {
      if (a.e[i][k].abs() > max) {
        max = a.e[i][k].abs();
        y = i;
      }
    }
    pivot[k] = y;

    if(y != k) {
      // pivot, interchange two rows. After this, the row we need is at k, not at y, so continue with k after this
      for(var i = 0; i < a.h; i++) {
        var temp = a.e[y][i];
        a.e[y][i] = a.e[k][i];
        a.e[k][i] = temp;
      }
      parity ^= 1;
    }

    //Returning for singular commented out: still works, resulting U will be singular.
    //if(C.nearr(a.e[k][k], 0, 1e-15)) return null; // singular

    for(var i = k + 1; i < a.h; i++) {
      a.e[i][k] = a.e[i][k].div(a.e[k][k]);
      if(C.isNaN(a.e[i][k])) a.e[i][k] = C(0); // Set 0/0 to 0 for singular input matrix.
    }
    for(var i = k + 1; i < a.h; i++) {
      for(var j = k + 1; j < a.w; j++) {
        a.e[i][j] = a.e[i][j].sub(a.e[i][k].mul(a.e[k][j]));
      }
    }
  }

  return [a, pivot, parity];
};

// LUP decomposition. Returns object {p: P, l: L, u: U} such that A = P*L*U, with P a permutation matrix, L lower triangular with ones on diagonal, U upper triangular
// Uses Doolittle algorithm with row pivoting
// Returns if a is singular.
Jmat.Matrix.lu = function(a) {
  var M = Jmat.Matrix;
  var C = Jmat.Complex;
  var r = M.doolittle_lup_(a);
  if(!r) return r; // error
  a = r[0];
  var pivot = r[1];

  // the above algorithm stored L and U in A, and P in the pivot array
  // now instead turn these into the 3 output matrices

  var l = M.identity(a.w); // the implicit ones on its diagonal were not stored in A above.
  var u = M.zero(a.w);
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if(x >= y) {
        u.e[y][x] = a.e[y][x];
      } else {
        l.e[y][x] = a.e[y][x];
      }
    }
  }

  var p = M.zero(a.w);
  var pivot2 = []; // list with index of each row in the permutation matrix
  for(var i = 0; i < a.h; i++) pivot2[i] = i;
  for(var i = 0; i < a.h; i++) {
    var temp = pivot2[i]; pivot2[i] = pivot2[pivot[i]]; pivot2[pivot[i]] = temp;
  }
  for(var i = 0; i < a.h; i++) {
    p.e[pivot2[i]][i] = C(1);
  }

  return {p: p, l: l, u: u};
};

// Submatrix with 1 row removed
Jmat.Matrix.subrow = function(a, row) {
  if(a.h < 2) return null;
  var m = new Jmat.Matrix(a.h - 1, a.w);
  for(var y = 0; y < a.h - 1; y++) {
    for(var x = 0; x < a.w; x++) {
      m.e[y][x] = a.e[y < row ? y : y + 1][x];
    }
  }
  return m;
};

// Submatrix with 1 column removed
Jmat.Matrix.subcol = function(a, col) {
  if(a.w < 2) return null;
  var m = new Jmat.Matrix(a.h, a.w - 1);
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w - 1; x++) {
      m.e[y][x] = a.e[y][x < col ? x : x + 1];
    }
  }
  return m;
};

// The submatrix for a minor, that is, with one row and one column removed
Jmat.Matrix.minorsub = function(a, row, col) {
  if(a.h < 2 || a.w < 2) return null;
  var m = new Jmat.Matrix(a.h - 1, a.w - 1);
  for(var y = 0; y < a.h - 1; y++) {
    for(var x = 0; x < a.w - 1; x++) {
      m.e[y][x] = a.e[y < row ? y : y + 1][x < col ? x : x + 1];
    }
  }
  return m;
};

//submatrix defined by the rectangle y0:y1 x0:x1 (excluding y1 and x1)
//e.g. to get the bottom right 2x2 submatrix of a 5x5 matrix a, use:
//Jmat.Matrix.submatrix(a, 3, 5, 3, 5)
//note that x and y are 0-indexed, so 5 is outside the matrix
Jmat.Matrix.submatrix = function(a, y0, y1, x0, x1) {
  if(x0 < 0 || y0 < 0 || x0 > a.w || y0 > a.h) return null;
  if(x1 < 0 || y1 < 0 || x1 > a.w || y1 > a.h) return null;
  var w2 = x1 - x0;
  var h2 = y1 - y0;
  if(w2 <= 0 || h2 <= 0 || w2 > a.w || h2 > a.h) return null;

  var result = new Jmat.Matrix(h2, w2);

  for(var y = 0; y < h2; y++) {
    for(var x = 0; x < w2; x++) {
      result.e[y][x] = a.e[y0 + y][x0 + x];
    }
  }

  return result;
};

// Requires square matrix
Jmat.Matrix.minor = function(a, row, col) {
  if(a.h < 2 || a.w < 2 || a.w != a.h) return Jmat.Complex(NaN);
  var m = Jmat.Matrix.minorsub(a, row, col);
  return Jmat.Matrix.determinant(m);
};

// cofactor: minor with sign depending on alternating position
Jmat.Matrix.cofactor = function(a, row, col) {
  var m = Jmat.Matrix.minor(a, row, col);
  var sign = ((row + col) & 1) == 0 ? 1 : -1;
  return m.mulr(sign);
};

Jmat.Matrix.determinant = function(a) {
  if(a.w != a.h) return NaN; //square matrices only

  if(a.w == 1) return a.e[0][0];
  if(a.w == 2) return a.e[0][0].mul(a.e[1][1]).sub(a.e[0][1].mul(a.e[1][0]));

  // Laplace expansion, this is an O(n!) algorithm, so not used
  /*var result = Jmat.Complex(0);
  for(var x = 0; x < a.w; x++) {
    result = result.add(a.e[0][x].mul(Jmat.Matrix.cofactor(a, 0, x)));
  }*/

  // Calculate with LU decomposition
  var lu = Jmat.Matrix.doolittle_lup_(a);
  var result = Jmat.Complex(1);
  for(var i = 0; i < a.w; i++) {
    result = result.mul(lu[0].e[i][i]);
  }
  if(lu[2] & 1) result = result.neg();


  return result;
};

//Adjugate aka Adjoint matrix
Jmat.Matrix.adj = function(a) {
  if(a.w != a.h) return NaN; //square matrices only
  if(a.w == 1) return Jmat.Matrix.identity(1, 1);

  //result matrix
  var r = new Jmat.Matrix(a.h, a.w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      //row and column are switched (transpose)
      r.e[y][x] = Jmat.Matrix.cofactor(a, x, y);
    }
  }

  return r;
};

// Inverse of a matrix
Jmat.Matrix.inv = function(a) {
  if(a.w != a.h) return null; //square matrices only

  //Cramer's rule
  return Jmat.Matrix.mulc(Jmat.Matrix.adj(a), Jmat.Complex.inv(Jmat.Matrix.determinant(a)));
};

//forced pseudoinverse (does not try regular inverse first)
Jmat.Matrix.pseudoinverse_ = function(a) {
  //TODO: instead of formula below, easier ways are available for scalars, vectors, lin. indep. rows/columns, ...

  var svd = Jmat.Matrix.svd(a);
  var n = Math.min(svd.s.w, svd.s.h);
  var tolerance = 1e-15; // choose this such that e.g. the pseudoinverse of [[1,2],[1,2]] returns [[0.1,0.2],[0.1,0.2]] - if the tolerance is too small, some near zero gets inverted and the result very wrong (depends on the svd algorithm used of course)
  // Invert all the elements of s, except those that are zero (with some tolerance due to numerical problems)
  // Each element of s should be real, and it only has elements on the diagonal
  for(var i = 0; i < n; i++) svd.s.e[i][i] = (Math.abs(svd.s.e[i][i].re) < tolerance) ? svd.s.e[i][i] : Jmat.Complex.inv(svd.s.e[i][i]);
  svd.s = Jmat.Matrix.transpose(svd.s);

  return Jmat.Matrix.mul(Jmat.Matrix.mul(svd.v, svd.s), Jmat.Matrix.transjugate(svd.u));
};

//Moore-Penrose pseudoinverse: one unique solution for any matrix
Jmat.Matrix.pseudoinverse = function(a) {
  /*
  Test in console:
  var result = Jmat.Matrix.pseudoinverse(Jmat.Matrix.make(2,2,1,2,1,2));
  var orig = Jmat.Matrix.pseudoinverse(result);
  result.toString() + ' | ' + orig.toString();
  */

  //first try if regular inverse works, if so that is more accurate and faster
  var result = Jmat.Matrix.inv(a);
  if(Jmat.Matrix.isValid(result)) return result;

  return Jmat.Matrix.pseudoinverse_(a);
};

Jmat.Matrix.getFirstNonZeroDigit_ = function(v) {
  if(v == 0) return 0;
  if(v < 0) v = -v;
  for(var i = 0; i < 100; i++) {
    if(v < 1) v *= 10;
    else if(v >= 10) v /= 10;
    else return Math.floor(v);
  }
  return 0;
};

// Get the matrix representation as a single decimal number. E.g. a [[1,2],[3,4]] would become 22.1234. The dimensions before the comma, the first digit of each value after the comma.
Jmat.Matrix.getDebugNumber = function(a) {
  var result = a.w + 10*a.h;
  var pos = 0.1;
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var v = Jmat.Matrix.getFirstNonZeroDigit_(a.e[y][x].re);
      result += v * pos;
      pos /= 10;
    }
  }

  // fix some numerical problem
  pos *= 10;
  result = Math.round(result / pos) * pos;

  return Jmat.Complex(result);
};

/*
Matrix norms:
This list is shown here to ensure to not confuse the Frobenius norm with the 2-norm
oo = infinity

induced norm (aka operator norm, matrix p-norm)
------------
1-norm: maximum absolute column sum of the matrix --> Jmat.maxcolnorm
2-norm: largest singular value, aka spectral norm or 2-norm --> Jmat.Matrix.norm2
oo-norm: maximum absolute row sum of the matrix --> Jmat.Matrix.maxrownorm

entrywise norms (vector p-norm)
---------------
entrywise 1-norm: sum of abs of all the elements --> Jmat.Matrix.vectorNorm with p=0
entrywise 2-norm: Frobenius norm, sqrt of sum of squares of the elements --> Jmat.Matrix.norm
entrywise oo-norm: maximum of abs of all the elements, Chebyshev norm --> Jmat.Matrix.chebNorm
arbitrary entrywise norm: --> Jmat.Matrix.vectorNorm
L2,1-norm: sum of Euclidean norms of columns --> Jmat.Matrix.lpqNorm with p=2, q=1

schatten norms
--------------
schatten 1-norm: sum of singular values, aka nuclear norm or trace norm --> Jmat.Matrix.schattenNorm with p = 1
schatten 2-norm: sqrt of sum of squares of singular values, results in same value as Frobenius norm --> Jmat.Matrix.norm
schatten oo-norm: max of the singular values, aka spectral norm or 2-norm --> Jmat.Matrix.norm2

Ky Fan norms
------------
first Ky Fan norm: max of the singular values, aka spectral norm or 2-norm --> Jmat.Matrix.norm2
last Ky Fan norm: sum of singular values, aka nuclear norm or trace norm --> Jmat.Matrix.schattenNorm with p = 1
*/

//Frobenius norm of the matrix (sqrt of sum of squares of modulus of all elements)
//For a vector, this is the Euclidean norm.
//TODO: since usually the more expensive to calculate 2-norm is meant by "the" norm of the matrix, maybe rename this function to "frobeniusnorm" or "frob"?
Jmat.Matrix.norm = function(m) {
  var result = 0;
  for(var y = 0; y < m.h; y++) {
    for(var x = 0; x < m.w; x++) {
      var e = m.e[y][x];
      result += e.abssq();
    }
  }
  result = Math.sqrt(result);
  return Jmat.Complex(result);
};

//Maximum absolute column sum norm
Jmat.Matrix.maxcolnorm = function(m) {
  var result = 0;
  for(var x = 0; x < m.w; x++) {
    var current = 0;
    for(var y = 0; y < m.h; y++) {
      current += m.e[y][x].abssq();
    }
    if (current > result) result = current;
  }
  return Jmat.Complex(result);
};

//Maximum absolute row sum norm
Jmat.Matrix.maxrownorm = function(m) {
  var result = 0;
  for(var y = 0; y < m.h; y++) {
    var current = 0;
    for(var x = 0; x < m.w; x++) {
      current += m.e[y][x].abssq();
    }
    if (current > result) result = current;
  }
  return Jmat.Complex(result);
};

//2-norm: largest singular value (= sqrt of largest eigenvalue of m^H * m). AKA spectral norm
Jmat.Matrix.norm2 = function(m) {
  var svd = Jmat.Matrix.svd(m);
  return svd.s.e[0][0];
};

// entrywise norm with arbitrary p (vector p-norm)
// works on all elements of the matrix (it does not have to be a vector)
// NOTE: p must be given as complex number, not regular JS number
// with p = 0 (handwavy): calculates hamming distance of elements to zero
// with p = 1: entriwise manhattan norm
// with p = 2: frobenius norm
// with p = Infinity: maximum absolute value of elements
// with other p: arbitrary p-norms with complex p
Jmat.Matrix.vectorNorm = function(m, p) {
  var C = Jmat.Complex;
  if(C.isReal(p)) {
    var result = 0;
    for(var y = 0; y < m.h; y++) {
      for(var x = 0; x < m.w; x++) {
        var e = m.e[y][x];
        if(p.eqr(0)) {
          if(!C.nearr(e, 0, 1e-15)) result++;
        } else if(p.eqr(1)) {
          result += e.abs();
        } else if(p.eqr(2)) {
          result += e.abssq();
        } else if(p.eqr(Infinity)) {
          result = Math.max(e.abs(), result);
        } else {
          result += Math.pow(e.abssq(), p.re / 2);
        }
      }
    }
    if(result == Infinity && p.re > 0) return Jmat.Matrix.vectorNorm(m, C(Infinity)); // overflow, approximate with max norm instead
    if(p.eqr(2)) {
      result = Math.sqrt(result);
    } else if(!p.eqr(0) && !p.eqr(1) && !p.eqr(Infinity)) {
      result = Math.pow(result, 1 / p.re);
    }
    return C(result);
  } else {
    var result = C(0);
    for(var y = 0; y < m.h; y++) {
      for(var x = 0; x < m.w; x++) {
        var e = C.abssq(m.e[y][x]);
        result = result.add(e.pow(p.divr(2)));
      }
    }
    if(result.eqr(0)) return result;
    return C.pow(result, p.inv());
  }
};

// Lp,q norm, e.g. L2,1 norm for p=2, q=1
Jmat.Matrix.lpqNorm = function(m, p, q) {
  var M = Jmat.Matrix;
  var a = M(1, m.w);
  for(var x = 0; x < m.w; x++) {
    a.e[0][x] = M.vectorNorm(M.col(m, x), p);
  }
  return M.vectorNorm(a, q);
};

// Schatten norm with arbitrary p
// NOTE: p must be given as complex number, not regular JS number
// with p = 1: sum of singular values: nuclear norm or trace norm
// with p = 2: sqrt of sum of squares of singular values, results in same value as Frobenius norm
// with p = Infinity: value of largest singular value
// with other p: arbitrary p-norm of the singular values
Jmat.Matrix.schattenNorm = function(m, p) {
  if(p.eqr(2)) return Jmat.Matrix.norm(m); // not needed to calculate singular values if it's two, as it's the same as frobenius norm
  if(p.eqr(Infinity)) return Jmat.Matrix.norm2(m); // spectral norm
  var M = Jmat.Matrix;
  var svd = M.svd(m);
  var d = M.diagToRow(svd.s);
  return M.vectorNorm(d, p);
};

//Maximum absolute element value
Jmat.Matrix.chebNorm = function(m) {
  var result = 0;
  for(var x = 0; x < m.w; x++) {
    for(var y = 0; y < m.h; y++) {
      result = Math.max(m.e[y][x].abs());
    }
  }
  return Jmat.Complex(result);
};

// dist, cheb and manhattan all return regular real JS numbers for all types. In some types they are all the same, but not for e.g. Complex or Matrix.
// Euclidean distance
Jmat.Matrix.dist = function(a, b) {
  return Jmat.Matrix.norm(a.sub(b)).re;
};
//Chebyshev distance
Jmat.Matrix.cheb = function(a, b) {
  var result = 0; // chebyshev norm, sup norm, max norm or infinity norm of a-b
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result = Math.max(result, Jmat.Complex.cheb(a.e[y][x], b.e[y][x]));
    }
  }
  return result;
};
// Manhattan distance
Jmat.Matrix.manhattan = function(a, b) {
  var result = 0; // chebyshev norm, sup norm, max norm or infinity norm of a-b
  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      result += Jmat.Complex.manhattan(a.e[y][x], b.e[y][x]);
    }
  }
  return result;
};

//condition number: largest singular value divided through smallest singular value. Higher ==> more imprecise numerical calculations with this matrix.
//Infinity means the matrix is singular. For numerical stability, consider singular if above e.g. 1/1e-15
Jmat.Matrix.conditionNumber = function(m) {
  var svd = Jmat.Matrix.svd(m);
  var d = Math.min(m.w, m.h);
  var result = svd.s.e[0][0].div(svd.s.e[d - 1][d - 1]);
  if (Jmat.Complex.isNaN(result)) result = Jmat.Complex(Infinity);
  return result;
};

//Rank of matrix
Jmat.Matrix.rank = function(m, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-14 : opt_epsilon;
  // TODO: use the faster RRQR? Or at least svd that returns only s?
  var s = Jmat.Matrix.svd(m).s;
  var rank = 0;
  var n = Math.min(s.w, s.h);
  for(var i = 0; i < n; i++) {
    if(!Jmat.Real.near(s.e[i][i].re, 0, epsilon)) rank++;
  }
  return Jmat.Complex(rank);
};

// Mathematically only defined for square matrices, but will also return the
// sum of diagonal elements of non-square matrix in this implementation
Jmat.Matrix.trace = function(m) {
  var result = Jmat.Complex.ZERO;
  for(var x = 0; x < m.w && x < m.h; x++) result = result.add(m.e[x][x]);
  return result;
};

// Returns column as h*1 matrix. x is 0-indexed
Jmat.Matrix.col = function(m, x) {
  var r = new Jmat.Matrix(m.h, 1);
  for(var y = 0; y < m.h; y++) r.e[y][0] = m.e[y][x];
  return r;
};

// Returns row as 1*w matrix. y is 0-indexed
Jmat.Matrix.row = function(m, y) {
  var r = new Jmat.Matrix(1, m.w);
  for(var x = 0; x < m.w; x++) r.e[0][x] = m.e[y][x];
  return r;
};

// sets column x of matrix m to the values of c, in-place
// x is 0-indexed, and c must be a h*1 matrix
Jmat.Matrix.setCol = function(m, c, x) {
  for(var y = 0; y < m.h; y++) m.e[y][x] = c.e[y][0];
};

// sets row y of matrix m to the values of r, in-place
// y is 0-indexed, and r must be a 1*w matrix
Jmat.Matrix.setRow = function(m, r, y) {
  for(var x = 0; x < m.w; x++) m.e[y][x] = r.e[0][x];
};

// Add two non-equal sized matrices.
// b's top left element is at position (row, col) in a (0-indexed)
// so the size of the result matrix is:
// max(row + b.h, a.h) - min(0, row) by max(col + b.w, a.w) - min(0, col)
// any element not overlapped by a or b, will be zero.
Jmat.Matrix.overlap = function(a, b, row, col) {
  var h = Math.max(row + b.h, a.h) - Math.min(0, row);
  var w = Math.max(col + b.w, a.w) - Math.min(0, col);

  var result = Jmat.Matrix.zero(h, w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var rx = col < 0 ? x - col : x;
      var ry = row < 0 ? y - row : y;
      result.e[ry][rx] = a.e[y][x];
    }
  }

  for(var y = 0; y < b.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var rx = col < 0 ? x : x + col;
      var ry = row < 0 ? y : y + row;
      result.e[ry][rx] = result.e[ry][rx].add(b.e[y][x]);
    }
  }

  return result;
};

// given b shifted by row,col, insert it into a, overwriting the matching elements of a, leaving other elements of a untouched. Parts of b outside of a, are discarded. The result has the same size as a.
Jmat.Matrix.insertInPlace = function(a, b, row, col) {
  for(var y = 0; y < b.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var rx = x + col;
      var ry = y + row;
      if(rx >= 0 && rx < a.w && ry >= 0 && ry < a.h) {
        a.e[ry][rx] = b.e[y][x];
      }
    }
  }
};

// given b shifted by row,col, insert it into a, overwriting the matching elements of a, leaving other elements of a untouched. Parts of b outside of a, are discarded. The result has the same size as a.
Jmat.Matrix.insert = function(a, b, row, col) {
  var result = Jmat.Matrix.copy(a);
  Jmat.Matrix.insertInPlace(result, b, row, col);
  return result;
};

// similar to insert, but will write outside the matrix if needed, increasing its size
// by default, appends to the right
Jmat.Matrix.augment = function(a, b, opt_row, opt_col) {
  var row = (opt_row == undefined ? 0 : opt_row);
  var col = (opt_col == undefined ? a.w : opt_col);
  var h = Math.max(row + b.h, a.h) - Math.min(0, row);
  var w = Math.max(col + b.w, a.w) - Math.min(0, col);

  var result = Jmat.Matrix.zero(h, w);

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var rx = col < 0 ? x - col : x;
      var ry = row < 0 ? y - row : y;
      result.e[ry][rx] = a.e[y][x];
    }
  }

  for(var y = 0; y < b.h; y++) {
    for(var x = 0; x < b.w; x++) {
      var rx = col < 0 ? x : x + col;
      var ry = row < 0 ? y : y + row;
      result.e[ry][rx] = b.e[y][x];
    }
  }

  return result;
};

// given a partial column vector x of a matrix, returns [v, tau] with:
// v a normalized householder reflection vector
// tau the multiplication factor (0 if degenerate, 2 if real)
// opt_real: set to true if you know the matrix is real
Jmat.Matrix.getHouseholderVector_ = function(x, opt_real) {
  var M = Jmat.Matrix;
  var C = Jmat.Complex;

  // Calculate the householder reflection vector
  var s = x.e[0][0].eqr(0) ? C(-1) : C.sign(x.e[0][0]);
  var v = M.identity(x.h, 1).mulc(s.mul(M.norm(x))).add(x);
  var degenerate = M.isZero(v, 1e-30);
  if(!degenerate) v = v.divc(M.norm(v)); // normalize

  // Calculate the multiplication factor, taking complex matrices and degenerateness into account
  var tau;
  if(degenerate) {
    tau = C(0); // In case of a degenerate column, do no reflection by setting tau to zero
  } else if(opt_real) {
    tau = C(2);
  } else {
    // complex
    var xhv = M.mul(M.row(M.transjugate(x), 0), v);
    var vhx = M.mul(M.transjugate(v), M.col(x, 0));
    tau = xhv.e[0][0].div(vhx.e[0][0]).addr(1);
  }

  return [v, tau];
};

// Returns the c and s parameters for givens rotation as array [c, s].
Jmat.Matrix.getGivensParams_ = function(a, b) {
  if(b.eqr(0)) return [Jmat.Complex(1), Jmat.Complex(0), a];
  // It is very important that the hypot function is implemented as "t=(|x|>|y|)?|y/x|:|x/y|;return sqrt(t*t+1)", and not as the numerically less stable "return sqrt(|x|^2+|y|^2)",
  // or else numerical imprecisions will show up in some eigenvalues of some large matrices.
  var r = Jmat.Complex.hypot(a, b);
  var c = a.div(r);
  var s = b.div(r).neg();
  return [c, s, r];
};

// Pre-multiply for givens transformation G, in-place
// returns G^H * M, calculating only the affected elements
Jmat.Matrix.givensPre_ = function(m, i, j, c, s) {
  for(var x = 0; x < m.w; x++) {
    var a = m.e[i][x];
    var b = m.e[j][x];
    m.e[i][x] = a.mul(c.conj()).add(b.mul(s.neg().conj()));
    m.e[j][x] = a.mul(s).add(b.mul(c));
  }
};

// Post-multiply for givens transformation G, in-place
// returns M * G, calculating only the affected elements
Jmat.Matrix.givensPost_ = function(m, i, j, c, s) {
  for(var y = 0; y < m.h; y++) {
    var a = m.e[y][i];
    var b = m.e[y][j];
    m.e[y][i] = a.mul(c).add(b.mul(s.neg()));
    m.e[y][j] = a.mul(s.conj()).add(b.mul(c.conj()));
  }
};

// do householder reflections to bring a to similar a in upper hessenberg form
Jmat.Matrix.toHessenberg = function(a) {
  var M = Jmat.Matrix;
  var T = M.transjugate;
  if(a.h != a.w) return null;
  var real = Jmat.Matrix.isReal(a);
  var r = M.copy(a);
  for(var k = 0; k + 2 < a.w; k++) {
    var x = M.submatrix(r, k + 1, r.h, k, k + 1); // partial column vector
    var vt = M.getHouseholderVector_(x, real);
    var v = vt[0];
    var tau = vt[1];

    var rs = M.submatrix(r, k + 1, r.h, k, r.w);
    rs = rs.sub(v.mul(T(v)).mul(rs).mulc(tau));
    r = M.insert(r, rs, k + 1, k);

    rs = M.submatrix(r, 0, r.h, k + 1, r.w);
    rs = rs.sub(rs.mul(v).mul(T(v)).mulc(tau));
    r = M.insert(r, rs, 0, k + 1);
  }
  //ensure the elements are really zero
  for(var y = 0; y < r.h; y++) {
    for(var x = 0; x < Math.max(y - 1, 0); x++) {
      r.e[y][x] = Jmat.Complex(0);
    }
  }

  return r;
};

// faster qr algorithm, a must be hessenberg
Jmat.Matrix.qr_hessenberg_ = function(a) {
  var M = Jmat.Matrix;
  var C = Jmat.Complex;
  var n = Math.min(a.h - 1, a.w);

  var r = M.copy(a);
  var q = M.identity(a.h, a.h);
  for(var k = 0; k < n; k++) {
    var g = M.getGivensParams_(r.e[k][k], r.e[k + 1][k]);
    M.givensPre_(r, k, k + 1, g[0], g[1]);
    r.e[k + 1][k] = C(0); // make extra sure it's zero
    M.givensPost_(q, k, k + 1, g[0], g[1]);
  }

  return { q: q, r: r };
};

Jmat.Matrix.qr_general_ = function(a) {
  var M = Jmat.Matrix;
  var T = M.transjugate;
  var real = Jmat.Matrix.isReal(a);
  var h = a.h;
  var w = a.w;
  var v = []; // the householder reflection vectors
  var taus = []; // the multiplication values

  if(a.h < a.w) return null;

  var r = M.copy(a);
  for(var k = 0; k < w; k++) {
    var x = M.submatrix(r, k, r.h, k, k + 1); // partial column vector
    var vt = M.getHouseholderVector_(x, real);
    v[k] = vt[0];
    taus[k] = vt[1];

    // Calculate R: it is A left-multiplied by all the householder matrices
    var rs = M.submatrix(r, k, h, k, w);
    rs = rs.sub(v[k].mul(T(v[k])).mul(rs).mulc(taus[k]));
    r = M.insert(r, rs, k, k);
  }

  // Calculate Q: it is the product of all transjugated householder matrices
  var q = M.identity(h, h);
  for(var k = w - 1; k >= 0; k--) {
    var qs = M.submatrix(q, k, h, 0, h);
    qs = qs.sub(v[k].mul(T(v[k])).mul(qs).mulc(taus[k]));
    q = M.insert(q, qs, k, 0);
  }

  return { q: q, r: r };
};

// QR factorization of complex matrix (with householder transformations)
// requirement: m.h >= m.w
// returns {q: Q, r: R}
// q is h*h unitary matrix
// r is h*w upper triangular matrix
Jmat.Matrix.qr = function(a) {
  /*
  Tests in console:
  var qr = Jmat.qr([[1,2],[3,'4i']]); console.log(Matrix.render(qr.q)); console.log(Matrix.render(qr.r)); console.log(Matrix.render(qr.q.mul(qr.r)));
  var qr = Jmat.qr([[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]); console.log(Matrix.render(qr.q)); console.log(Matrix.render(qr.r)); console.log(Matrix.render(qr.q.mul(qr.r)));
  var qr = Jmat.qr(Jmat.Matrix(3,3,12,-51,4,6,167,-68,-4,24,-41)); console.log(Matrix.render(qr.q)); console.log(Matrix.render(qr.r)); console.log(Matrix.render(qr.q.mul(qr.r)));
  degenerate matrix:
  var qr = Jmat.qr([[1,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]); console.log(Matrix.render(qr.q)); console.log(Matrix.render(qr.r)); console.log(Matrix.render(qr.q.mul(qr.r)));
  */

  // The algorithm for hessenberg form is faster when applicable.
  return Jmat.Matrix.isUpperHessenberg(a, 1e-18) ?
      Jmat.Matrix.qr_hessenberg_(a) :
      Jmat.Matrix.qr_general_(a);
};

// eigenvalues and vectors of 1x1 matrix
Jmat.Matrix.eig11 = function(m) {
  if(m.w != 1 || m.h != 1) return null;
  var result = {};
  result.l = new Jmat.Matrix(1, 1);
  result.l.e[0][0] = Jmat.Complex(m.e[0][0]);
  result.v = new Jmat.Matrix(1, 1);
  result.v.e[0][0] = Jmat.Complex(1);
  return result;
};

// explicit algebraic formula for eigenvalues of 2x2 matrix
Jmat.Matrix.eigval22 = function(m) {
  if(m.w != 2 || m.h != 2) return null;
  var a = Jmat.Complex(1);
  var b = m.e[0][0].neg().sub(m.e[1][1]);
  var c = m.e[0][0].mul(m.e[1][1]).sub(m.e[0][1].mul(m.e[1][0]));
  var d = Jmat.Complex.sqrt(b.mul(b).sub(a.mul(c).mulr(4)));
  var l1 = b.neg().add(d).div(a.mulr(2));
  var l2 = b.neg().sub(d).div(a.mulr(2));
  if(l2.abssq() > l1.abssq()) return [l2, l1];
  return [l1, l2];
};

// explicit algebraic formula for eigenvalues and vectors of 2x2 matrix
Jmat.Matrix.eig22 = function(m) {
  if(m.w != 2 || m.h != 2) return null;

  var l = Jmat.Matrix.eigval22(m);
  var l1 = l[0];
  var l2 = l[1];

  var v11 = m.e[0][1].div(l1.sub(m.e[0][0]));
  var v12 = Jmat.Complex(1);
  var v21 = m.e[0][1].div(l2.sub(m.e[0][0]));
  var v22 = Jmat.Complex(1);

  var result = {};
  result.l = new Jmat.Matrix(2, 1);
  result.l.e[0][0] = l1;
  result.l.e[1][0] = l2;
  result.v = new Jmat.Matrix(2, 2);
  result.v.e[0][0] = v11;
  result.v.e[1][0] = v12;
  result.v.e[0][1] = v21;
  result.v.e[1][1] = v22;
  return result;
};

// calculates eigenvalues of complex upper hessenberg matrix, using the shifted QR algorithm with givens rotations
// h is nxn upper hessenberg matrix, and it gets destroyed during the process
Jmat.Matrix.eigval_ = function(h) {
  var C = Jmat.Complex;
  var M = Jmat.Matrix;
  var epsilon = 1.2e-16; // relative machine precision
  var n = h.w; // initially size of the matrix, gets reduced with every eigenvalue found
  var s = C(0); // shift
  var t = C(0); // undo shifts
  var x = C(0), y = C(0), z = C(0);

  var result = [];
  for(var i = 0; i < n; i++) result[i] = C(0);

  while(n > 0) {
    for(var num_it = 0; num_it <= 30; num_it++) {
      if(num_it == 30) return null; // fail after 30 iterations
      // find near-zero sub-diagonal element, at l
      var l;
      for (l = n - 1; l >= 1; l--) {
        if(C.abs1r(h.e[l][l-1]) <= epsilon * (C.abs1r(h.e[l-1][l-1]) + C.abs1r(h.e[l][l]))) {
          h.e[l][l-1] = C(0);  // fix possible numerical imprecisions
          break;
        }
      }
      if(l == n - 1) {
        // root found
        result[n-1] = h.e[n-1][n-1].add(t);
        n--;
        break;
      }
      // calculate shift for shifted QR step
      if(num_it == 10 || num_it == 20) {
        // use a special shift after 10 or 20 iterations
        s.re = Math.abs(h.e[n-1][n-2].re) + Math.abs(h.e[n-2][n-3].re);
        s.im = Math.abs(h.e[n-1][n-2].im) + Math.abs(h.e[n-2][n-3].im);
      } else {
        s = h.e[n-1][n-1];
        x = h.e[n-2][n-1].mul(h.e[n-1][n-2]);
        if(!x.eqr(0)) {
          y = (h.e[n-2][n-2].sub(s)).divr(2);
          z = C.sqrt(y.mul(y).add(x));
          if(y.re * z.re + y.im * z.im < 0) z = z.neg();
          x = x.div(y.add(z));
          s = s.sub(x);
        }
      }
      // apply shift
      for(var i = 0; i < n; i++) {
        h.e[i][i] = h.e[i][i].sub(s);
      }
      t = t.add(s);

      // fast QR step with givens rotations. Implicitely decomposes h into Q*R, then sets h to R*Q (also, only uses nxn sub-matrix of original h).
      var g = []; // remember each of the givens parameters
      for (var k = 0; k + 1 < n; k++) {
        g[k] = M.getGivensParams_(h.e[k][k], h.e[k + 1][k]);
        M.givensPre_(h, k, k + 1, g[k][0], g[k][1]);
        h.e[k + 1][k] = C(0); // make extra sure it's zero
        h.e[k][k] = g[k][2]; // also, the r returned by getGivensParams_ is more precise here
      }
      for (var k = 0; k + 1 < n; k++) {
        M.givensPost_(h, k, k + 1, g[k][0], g[k][1]);
      }
    }
  }
  return result;
};

// Returns the eigenvalues of m in an array, from largest to smallest
Jmat.Matrix.eigval = function(m) {
  var M = Jmat.Matrix;
  if(m.w != m.h || m.w < 1) return null;
  var n = m.w;
  if(n == 1) return [m.e[0][0]];
  if(n == 2) return M.eigval22(m);

  // TODO: for hermitian or symmetric matrix, use faster algorithm for eigenvalues

  var a = M.toHessenberg(m);
  var l = M.eigval_(a);

  // Fullfill our promise of eigenvalues sorted from largest to smallest magnitude, the eigenvalue algorithm usually has them somewhat but not fully correctly sorted
  l.sort(function(a, b) { return b.abssq() - a.abssq(); });

  return l;
};

// Returns the eigenvector matching the given eigenvalue of m as a column vector
// m must be a square matrix, and lambda a correct eigenvalue of it
// opt_normalize is how to normalize the eigenvector: 0: don't (length unspecified), 1: last element equals 1, 2: length 1. The default is "1".
Jmat.Matrix.eigenVectorFor = function(m, lambda, opt_normalize) {
  var M = Jmat.Matrix;
  if(m.w != m.h || m.w < 1) return null;
  var n = m.w;
  var normalize_mode = (opt_normalize == undefined) ? 1 : opt_normalize;

  // Find eigenvectors by solving system of linear equations.
  m = M.copy(m); //avoid changing user input
  for(var i = 0; i < n; i++) m.e[i][i] = m.e[i][i].sub(lambda);
  var f = M.zero(n, 1);
  var g = M.solve(m, f, 0.01); // a very large epsilon is used... because the eigenvalues are numerically not precise enough to give the singular matrix they should
  if(g) {
    if(normalize_mode == 2) g = g.divc(M.norm(g));
    if(normalize_mode == 1) if(!g.e[n - 1][0].eqr(0)) g = g.divc(g.e[n - 1][0]);
  } else {
    // failed to find the corresponding eigenvectors, avoid crash, set values to NaN
    g = M.zero(n, 1);
    for(var i = 0; i < n; i++) g.e[i][0] = Jmat.Complex(NaN, NaN); // The eigenvectors are stored as column vectors
  }
  return g;
};

// Returns eigenvalues and eigenvectors of real symmetric matrix with the Jacobi eigenvalue algorithm, as { l: eigenvalues, v: eigenvectors }
// For correct result, requires that m is square, real and symmetric.
Jmat.Matrix.jacobi_ = function(m, opt_epsilon, opt_normalize) {
  var a = [];
  var v = [];
  var n = m.w;
  for(var y = 0; y < n; y++) {
    a[y] = [];
    for(var x = 0; x < n; x++) {
      a[y][x] = m.e[y][x].re;
    }
  }
  Jmat.Real.matrix_jacobi(a, v, n, opt_epsilon);

  if(opt_normalize == 1 || opt_normalize == undefined) {
    for(var y = 0; y < n; y++) {
      if(v[y][n - 1] == 0) continue;
      for(var x = 0; x < n; x++) {
        v[y][x] /= v[y][n - 1];
      }
    }
  }
  v = Jmat.Matrix(v).transpose();
  var l = Jmat.Matrix(n, 1);
  for(var i = 0; i < n; i++) {
    l.e[i][0] = Jmat.Complex(a[i][i]);
  }

  return { l: l, v: v };
};

// Returns the eigenvectors and eigenvalues of m as { l: eigenvalues, v: eigenvectors }
// eigenvalues as n*1 column vector, eigenvectors as n*n matrix
// for each column of v and corresponding eigenvalue: A*v = l*v (l represents lambda, A is m)
// opt_normalize is how to normalize the eigenvectors: 0: don't (length unspecified), 1: last element equals 1, 2: length 1. The default is "1".
Jmat.Matrix.eig = function(m, opt_normalize) {
  var M = Jmat.Matrix;
  if(m.w != m.h || m.w < 1) return null;
  var n = m.w;
  if(n == 1) return M.eig11(m);
  if(n == 2) return M.eig22(m);

  if(M.isReal(m) && M.isSymmetric(m)) return Jmat.Matrix.jacobi_(m, opt_normalize);

  var l = M.eigval(m);

  // Fullfill our promise of eigenvalues sorted from largest to smallest magnitude, the eigenvalue algorithm usually has them somewhat but not fully correctly sorted
  l.sort(function(a, b) { return b.abssq() - a.abssq(); });

  var v = null;
  // TODO: use more efficient algorithm for eigenvectors, e.g. something that produces them as side-effect of the eigenvalue calculation
  // TODO: for hermitian or symmetric matrix, use faster algorithm for eigenvectors
  var v = new M(n, n);
  for(var j = 0; j < n; j++) {
    var g = M.eigenVectorFor(m, l[j], opt_normalize);
    M.setCol(v, g, j);
  }

  return { l: l, v: v };
};

// Returns the eigen decomposition of m as { v: V, d: D }
// If M is diagonizable, M = V * D * V^(-1)
// In other words: m == result.v.mul(result.d).mul(Jmat.Matrix.inv(result.v))
// This function is very similar to Jmat.Matrix.eig. v is the same, d is the same as l but put on the diagonal of a matrix
Jmat.Matrix.evd = function(m) {
  var eig = Jmat.Matrix.eig(m);

  return { v: eig.v, d: Jmat.Matrix.diag(eig.l) };
};

// returns the definiteness as an array of 3 booleans
// the first boolean means negative eigenvalues are present
// the second boolean means eigenvalues of zero are present
// the third boolean means positive eigenvalues are present
// ignores whether it's hermitian or not, but requires square matrix
Jmat.Matrix.definiteness_ = function(m, opt_epsilon) {
  var epsilon = (opt_epsilon == undefined) ? 1e-12 : opt_epsilon; // default is 1e-12 instead of the usual 1e-15 because eigenvalues of [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]] is otherwise not precise enough, making it think that one is indefinite
  // TODO: faster method than eigenvalues
  var e = Jmat.Matrix.eigval(m);
  if(!e) return null;
  var result = [false, false, false];
  for (var i = 0; i < e.length; i++) {
    if(Jmat.Real.near(e[i].re, 0, epsilon)) result[1] = true;
    else if(e[i].re > 0) result[2] = true;
    else result[0] = true;
  }
  return result;
};

Jmat.Matrix.INDEFINITE = 0;
Jmat.Matrix.POSITIVE_DEFINITE = 1;
Jmat.Matrix.POSITIVE_SEMI_DEFINITE = 2;
Jmat.Matrix.NEGATIVE_DEFINITE = 3;
Jmat.Matrix.NEGATIVE_SEMI_DEFINITE = 4;

// For a hermitian matrix (symmetric if real), returns its definiteness using the constants above.
// For non-hermitian matrix, returns null to indicate invalid. Use (M + transjugate(M)) / 2 to get it anyway
// Returns only one value that best describes the matrix. In practice, multiple values may apply:
// -a POSITIVE_DEFINITE matrix is always also POSITIVE_SEMI_DEFINITE
// -a NEGATIVE_DEFINITE matrix is always also NEGATIVE_SEMI_DEFINITE
// -a null matrix is both POSITIVE_SEMI_DEFINITE and NEGATIVE_SEMI_DEFINITE but this function only returns one of those
Jmat.Matrix.definiteness = function(m, opt_epsilon) {
  if(!Jmat.Matrix.isHermitian(m, opt_epsilon)) return null;
  var bools = Jmat.Matrix.definiteness_(m, opt_epsilon);
  if(bools[2] && !bools[0] && !bools[1]) return Jmat.Matrix.POSITIVE_DEFINITE;
  if(bools[0] && !bools[2] && !bools[1]) return Jmat.Matrix.NEGATIVE_DEFINITE;
  if(!bools[0]) return Jmat.Matrix.POSITIVE_SEMI_DEFINITE;
  if(!bools[2]) return Jmat.Matrix.NEGATIVE_SEMI_DEFINITE;
  if(bools[0] && bools[2]) return Jmat.Matrix.INDEFINITE;
  return null; // unreachable
};

// converts an array of complex values or regular JS numbers, to a column vector matrix
Jmat.Matrix.arrayToCol = function(a) {
  var r = new Jmat.Matrix(a.length, 1);
  for(var i = 0; i < a.length; i++) r.e[i][0] = Jmat.Complex.cast(a[i]);
  return r;
};

// converts an array of complex values or regular JS numbers, to a row vector matrix
Jmat.Matrix.arrayToRow = function(a) {
  var r = new Jmat.Matrix(1, a.length);
  for(var i = 0; i < a.length; i++) r.e[0][i] = Jmat.Complex.cast(a[i]);
  return r;
};

// converts an array of complex values or regular JS numbers, to a diagonal matrix
Jmat.Matrix.arrayToDiag = function(a) {
  //var r = Jmat.Matrix.zero(a.length, a.length);
  var r = new Jmat.Matrix(a.length, a.length);
  for(var i = 0; i < a.length; i++) r.e[i][i] = Jmat.Complex.cast(a[i]);
  return r;
};

// Puts all the elements of matrix d in a single diagonal matrix
Jmat.Matrix.diag = function(d) {
  var n = d.w * d.h;
  var result = Jmat.Matrix.zero(n, n);
  var i = 0;
  for(var y = 0; y < d.h; y++) {
    for(var x = 0; x < d.w; x++) {
      result.e[i][i] = d.e[y][x];
      i++;
    }
  }
  return result;
};

// Puts all diagonal elements from a into a single column vector
Jmat.Matrix.diagToCol = function(a) {
  var n = Math.min(a.h, a.w);
  var result = Jmat.Matrix(n, 1);
  for(var i = 0; i < n; i++) result.e[i][0] = a.e[i][i];
  return result;
};

// Puts all diagonal elements from a into a single row vector
Jmat.Matrix.diagToRow = function(a) {
  var n = Math.min(a.h, a.w);
  var result = Jmat.Matrix(1, n);
  for(var i = 0; i < n; i++) result.e[0][i] = a.e[i][i];
  return result;
};

// Get element using a one-dimensional index. E.g. a 3x5 matrix has 15 elements, with index 0-14. The index is row by row.
Jmat.Matrix.get1 = function(m, i) {
  var x = i % m.w;
  var y = Math.floor(i / m.w);
  return m.e[y][x];
};
Jmat.Matrix.prototype.get1 = function(i) {
  return Jmat.Matrix.get1(this, i);
};

// Set element using a one-dimensional index. See Jmat.Matrix.get1.
Jmat.Matrix.set1 = function(m, i, v) {
  var x = i % m.w;
  var y = Math.floor(i / m.w);
  m.e[y][x] = v;
};

// Cross product between two vectors of length 3, that is, 3x1 and/or 1x3 matrices. Other input dimensions are not accepted.
// Return value has dimensions of the first input (that is, if first input is row vector, it's row vector, otherwise column vector)
// Jmat.Matrix.cross(Jmat.Matrix([1,2,3]), Jmat.Matrix([4,5,6])).toString()
Jmat.Matrix.cross = function(a, b) {
  if(a.w * a.h != 3 || b.w * b.h != 3) return Jmat.Matrix(NaN);
  var c = new Jmat.Matrix(a.h, a.w);
  Jmat.Matrix.set1(c, 0, a.get1(1).mul(b.get1(2)).sub(a.get1(2).mul(b.get1(1))));
  Jmat.Matrix.set1(c, 1, a.get1(2).mul(b.get1(0)).sub(a.get1(0).mul(b.get1(2))));
  Jmat.Matrix.set1(c, 2, a.get1(0).mul(b.get1(1)).sub(a.get1(1).mul(b.get1(0))));
  return c;
};

// Dot product of two vectors.
// Also supports it for matrices of same dimensions (it then is the Frobenius inner product)
// If vectors, row and column vectors may be mixed.
Jmat.Matrix.dot = function(a, b) {
  if(a.w != b.w || a.h != b.h) {
    if(!(a.w == b.h && a.h == b.w && (a.w == 1 || a.h == 1))) return Jmat.Matrix(NaN); // Do allow it for differently orientated vectors (h or w is 1)
  }
  var n = a.w * a.h;
  var result = Jmat.Complex(0);
  for(var i = 0; i < n; i++) result = result.add(a.get1(i).mul(b.get1(i).conj()));
  return result;
};


/** @license
License of Jmat.Matrix.zsvdc_: this function is from linpack, from http://www.netlib.org/linpack/
The license is not mentioned directly in the source code or the website, but
has been said to now be a variant of the BSD license: see
https://bugzilla.redhat.com/show_bug.cgi?id=1000829.
Here is the original author comment from zsvdc.f:
    linpack. this version dated 03/19/79 .
             correction to shift calculation made 2/85.
    g.w. stewart, university of maryland, argonne national lab.
*/
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
// Based on LINPACK zsvdc.f, converted to JavaScript.
// Modifies argument arrays in place.
// Parameters:
//  x: input matrix, n*p, as a 1D array, row-wise
//  ldx: leading dimension of x, ldx >= n
//  n: matrix height
//  p: matrix width
//  s: output, vector of singular values (sorted)
//  e: output, matrix of possible error values
//  u: output, left singular vectors, n*n, as a 1D array, row-wise
//  ldu: leading dimension of u, ldu >= n
//  v: output, right singular vectors, p*p, as a 1D array, row-wise
//  ldv: leading dimension of v, ldv >= p
//  work: scratch array []
//  job: What to calculate. Decimal expansion AB. A=0:no u,1:u,>=2:partial u. B=0:no v,1:v. So to get everything, set job to 11.
// NOTE: "leading dimension" means first dimension of a 2D array, but the arrays are 1D.
//        Normally, leading dimension is the height, or higher if superfluous values were allocated in between.
Jmat.Matrix.zsvdc_ = function(x, ldx, n, p, s, e, u, ldu, v, ldv, work, job) {
  var i,iter,j,jobu,k,kase,kk,l,ll,lls,lp1,ls,lu,m,
      mm,mm1,mp1,nct,ncu,nrt,info; // integers
  var maxit = 30;
  var t,r; //complex
  var b,c,cs,el,emm1,f,g,dznrm2,scale,shift,sl,sm,sn,
      smm1,t1,test,ztest; // double

  var dr; //drotg result

  var dreal = function(z) { return z.re; };
  var cabs1 = function(z) { return Math.abs(z.re) + Math.abs(z.im); };
  var nearzero = function(z) {
    // At each nearzero call below, the original zsvdc instead checked "cabs1(z) != 0.0". Usually a division then follows. That
    // complex division can still result in inf and NaN for tiny numbers (e.g. 1e-307). Hence replaced with this check here.
    return cabs1(z) < 1e-150;
  };
  // returns value with absolute value of x, argument of y (transfers sign)
  var csign = function(x, y) { return y.eqr(0) ? Jmat.Complex(0) : y.mulr(x.abs() / y.abs()); };
  var sign = function(x, y) { return y == 0 ? 0 : (y < 0 ? -Math.abs(x) : Math.abs(x)); };
  // Euclidean norm of complex vector, n elements starting at index start
  var dznrm2 = function(n, arr, start) {
    var result = Jmat.Complex(0);
    for(var i = 0; i < n; i++) {
      var e = arr[start + i];
      result = result.add(e.mul(e.conj()));
    }
    return Jmat.Complex.sqrt(result);
  };
  // sets vector arry to alpha * arrx + arry
  var zaxpy = function(n, alpha, arrx, startx, arry, starty) {
    for(var i = 0; i < n; i++) {
      arry[starty + i] = arry[starty + i].add(arrx[startx + i].mul(alpha));
    }
  };
  // dot product
  var zdotc = function(n, arrx, startx, arry, starty) {
    var result = Jmat.Complex(0);
    for(var i = 0; i < n; i++) {
      result = result.add(arrx[startx + i].conj().mul(arry[starty + i]));
    }
    return result;
  };
  // scales the vector with complex value alpha
  var zscal = function(n, alpha, arr, start) {
    for(var i = 0; i < n; i++) {
      arr[start + i] = arr[start + i].mul(alpha);
    }
  };
  // returns [r, z, c, s]
  var drotg = function(a, b) {
    var a2 = Math.abs(a);
    var b2 = Math.abs(b);
    var r = sign(Math.sqrt(a * a + b * b), (a2 > b2) ? a : b);
    var c = r == 0 ? 1 : a / r;
    var s = r == 0 ? 0 : b / r;
    var z = a2 > b2 ? s : r == 0 ? 0 : c == 0 ? 1 : (1 / c);
    return [r, z, c, s];
  };
  // plane rotation on vectors
  var zdrot = function(n, arrx, startx, arry, starty, c, s) {
    for(var i = 0; i < n; i++) {
      var ax = arrx[startx + i];
      var ay = arry[starty + i];
      arrx[startx + i] = ax.mulr(c).add(ay.mulr(s));
      arry[starty + i] = ay.mulr(c).sub(ax.mulr(s));
    }
  };
  // swap two vectors
  var zswap = function(n, arrx, startx, arry, starty) {
    for(var i = 0; i < n; i++) {
      var temp = arrx[i + startx];
      arrx[i + startx] = arry[i + starty];
      arry[i + starty] = temp;
    }
  };
  var wantu = false;
  var wantv = false;
  jobu = Math.floor((job % 100) / 10);
  ncu = jobu > 1 ? Math.min(n, p) : n;
  if(jobu != 0) wantu = true;
  if((job % 10) != 0) wantv = true;
  // reduce x to bidiagonal form, storing the diagonal elements
  // in s and the super-diagonal elements in e.
  info = 0;
  nct = Math.min(n - 1, p);
  nrt = Math.max(0, Math.min(p - 2, n));
  lu = Math.max(nct, nrt);
  for(l = 0; l < lu; l++) {
    lp1 = l + 1;
    if(l < nct) {
      // compute the transformation for the l-th column and
      // place the l-th diagonal in s(l).
      s[l] = Jmat.Complex(dznrm2(n - l, x, l + l * ldx));
      if(!nearzero(s[l])) {
        if(!nearzero(x[l + l * ldx])) s[l] = csign(s[l], x[l + l * ldx]);
        t = Jmat.Complex(1.0).div(s[l]);
        zscal(n - l, t, x, l + l * ldx);
        x[l + l * ldx] = x[l + l * ldx].addr(1);
      }
      s[l] = s[l].neg();
    }
    for(j = lp1; j < p; j++) {
      if(l < nct) {
        if(!nearzero(s[l])) {
          t = zdotc(n - l, x, l + l * ldx, x, l + j * ldx).neg().div(x[l + l * ldx]);
          zaxpy(n - l, t, x, l + l * ldx, x, l + j * ldx);
        }
      }
      // place the l-th row of x into e for the
      // subsequent calculation of the row transformation.
      e[j] = x[l + j * ldx].conj();
    }
    // place the transformation in u for subsequent back multiplication.
    if(wantu && l < nct) {
      for(i = l; i < n; i++) {
        u[i + l * ldu] = x[i + l * ldx];
      }
    }
    if(l < nrt) {
      // compute the l-th row transformation and place the
      // l-th super-diagonal in e(l).
      e[l] = Jmat.Complex(dznrm2(p - l - 1, e, lp1));

      if(!nearzero(e[l])) {
        if(!nearzero(e[lp1])) {
          e[l] = csign(e[l], e[lp1]);
        }
        t = Jmat.Complex(1.0).div(e[l]);
        zscal(p - l - 1, t, e, lp1);
        e[lp1] = Jmat.Complex(1.0).add(e[lp1]);
      }
      e[l] = e[l].conj().neg();
      // apply the transformation.
      if(lp1 < n && !nearzero(e[l])) {
        for(j = lp1; j < n; j++) {
          work[j] = Jmat.Complex(0.0);
        }
        for(j = lp1; j < p; j++) {
          zaxpy(n - l - 1, e[j], x, lp1 + j * ldx, work, lp1);
        }
        for(j = lp1; j < p; j++) {
          zaxpy(n - l - 1, (e[j].neg().div(e[lp1])).conj(), work, lp1, x, lp1 + j * ldx);
        }
      }
      // place the transformation in v for subsequent back multiplication.
      if(wantv) {
        for(i = lp1; i < p; i++) {
          v[i + l * ldv] = e[i];
        }
      }
    }
  }
  // set up the final bidiagonal matrix of order m.
  m = Math.min(p, n + 1);
  if(nct < p) s[nct] = x[nct + nct * ldx];
  if(n < m) s[m - 1] = Jmat.Complex(0.0);
  if(nrt + 1 < m) e[nrt] = x[nrt + (m - 1) * ldx];
  e[m - 1] = Jmat.Complex(0.0);
  // if required, generate u.
  if(wantu) {
    for(j = nct; j < ncu; j++) {
      for(i = 0; i < n; i++) {
        u[i + j * ldu] = Jmat.Complex(0.0);
      }
      u[j + j * ldu] = Jmat.Complex(1.0);
    }
    for(ll = 0; ll < nct; ll++) {
      l = nct - ll - 1;
      if(cabs1(s[l]) == 0.0) {
        for(i = 0; i < n; i++) {
          u[i + l * ldu] = Jmat.Complex(0.0);
        }
        u[l + l * ldu] = Jmat.Complex(1.0);
      } else {
        lp1 = l + 1;
        for(j = lp1; j < ncu; j++) {
          t = zdotc(n - l, u, l + l * ldu, u, l + j * ldu).neg().div(u[l + l * ldu]);
          zaxpy(n - l, t, u, l + l * ldu, u, l + j * ldu);
        }
        zscal(n - l, Jmat.Complex(-1.0), u, l + l * ldu);
        u[l + l * ldu] = u[l + l * ldu].inc();
        for(i = 0; i < l; i++) {
          u[i + l * ldu] = Jmat.Complex(0.0);
        }
      }
    }
  }
  // if it is required, generate v.
  if(wantv) {
    for(ll = 0; ll < p; ll++) {
      l = p - ll - 1;
      lp1 = l + 1;
      if(l < nrt) {
        if(!nearzero(e[l])) {
          for(j = lp1; j < p; j++) {
            t = zdotc(p - lp1, v, lp1 + l * ldv, v, lp1 + j * ldv).neg().div(v[lp1 + l * ldv]);
            zaxpy(p - lp1, t, v, lp1 + l * ldv, v, lp1 + j * ldv);
          }
        }
      }
      for(i = 0; i < p; i++) {
        v[i + l * ldv] = Jmat.Complex(0);
      }
      v[l + l * ldv] = Jmat.Complex(1);
    }
  }
  // transform s and e so that they are real.
  for(i = 0; i < m; i++) {
    if(!nearzero(s[i])) {
      t = Jmat.Complex.abs(s[i]);
      r = s[i].div(t);
      s[i] = t;
      if(i + 1 < m) e[i] = e[i].div(r);
      if(wantu) zscal(n, r, u, i * ldu);
    }
    if(i + 1 == m) break;
    if(!nearzero(e[i])) {
      t = Jmat.Complex.abs(e[i]);
      r = t.div(e[i]);
      e[i] = t;
      s[i + 1] = s[i + 1].mul(r);
      if(wantv) zscal(p, r, v, (i + 1) * ldv);
    }
  }
  // main iteration loop for the singular values.
  mm = m;
  iter = 0;
  for(;;) {
    // quit if all the singular values have been found.
    if(m == 0) break;
    // if too many iterations have been performed, set flag and return.
    if(maxit <= iter) {
      info = m;
      break;
    }
    // this section of the program inspects for
    // negligible elements in the s and e arrays.  on
    // completion the variables kase and l are set as follows.
    //
    // kase = 1     if s(m) and e(l - 1) are negligible and l.lt.m
    // kase = 2     if s(l) is negligible and l.lt.m
    // kase = 3     if e(l - 1) is negligible, l.lt.m, and
    //              s(l), ..., s(m) are not negligible (qr step).
    // kase = 4     if e(m - 1) is negligible (convergence).
    for(ll = 1; ll <= m; ll++) {
      l = m - ll;
      if(l == 0) break;
      test = s[l - 1].abs() + s[l].abs();
      ztest = test + e[l - 1].abs();
      if(ztest == test) {
        e[l - 1] = Jmat.Complex(0.0);
        break;
      }
    }
    if(l == m - 1) {
      kase = 4;
    } else {
      lp1 = l + 1;
      mp1 = m + 1;
      for(lls = lp1; lls <= mp1; lls++) {
        ls = m - lls + lp1;
        if(ls == l) break;
        test = 0.0;
        if(ls != m) test = test + e[ls - 1].abs();
        if(ls != l + 1) test = test + e[ls - 2].abs();
        ztest = test + s[ls - 1].abs();
        if(ztest == test) {
          s[ls - 1] = Jmat.Complex(0.0);
          break;
        }
      }
      if(ls == l) {
        kase = 3;
      } else if(ls == m) {
        kase = 1;
      } else {
        kase = 2;
        l = ls;
      }
    }
    l++;
    // deflate negligible s(m).
    if(kase == 1) {
      mm1 = m - 1;
      f = dreal(e[m - 2]);
      e[m - 2] = Jmat.Complex(0.0);
      for(kk = l; kk <= mm1; kk++) {
        k = mm1 - kk + l;
        t1 = dreal(s[k - 1]);
        dr = drotg(t1, f); t1 = dr[0]; f = dr[1]; cs = dr[2]; sn = dr[3];
        s[k - 1] = Jmat.Complex(t1);
        if(k != l) {
          f = -sn * dreal(e[k - 2]);
          e[k - 2] = e[k - 2].mulr(cs);
        }
        if(wantv) zdrot(p, v, (k - 1) * ldv, v, (m - 1) * ldv, cs, sn);
      }
    }
    // split at negligible s(l).
    else if(kase == 2) {
      f = dreal(e[l - 2]);
      e[l - 2] = Jmat.Complex(0.0);
      for(k = l; k <= m; k++) {
        t1 = dreal(s[k - 1]);
        dr = drotg(t1, f); t1 = dr[0]; f = dr[1]; cs = dr[2]; sn = dr[3];
        s[k - 1] = Jmat.Complex(t1);
        f = -sn * dreal(e[k - 1]);
        e[k - 1] = e[k - 1].mulr(cs);
        if(wantu) zdrot(n, u, (k - 1) * ldu, u, (l - 2) * ldu, cs, sn);
      }
    }
    // perform one qr step.
    else if(kase == 3) {
      // calculate the shift.
      scale = Math.max(Math.max(Math.max(Math.max(s[m - 1].abs(),
              s[m - 2].abs()), e[m - 2].abs()), s[l - 1].abs()),
              e[l - 1].abs());
      sm = dreal(s[m - 1]) / scale;
      smm1 = dreal(s[m - 2]) / scale;
      emm1 = dreal(e[m - 2]) / scale;
      sl = dreal(s[l - 1]) / scale;
      el = dreal(e[l - 1]) / scale;
      b = ((smm1 + sm) * (smm1 - sm) + emm1 * emm1) / 2.0;
      c = (sm * emm1) * (sm * emm1);
      shift = 0.0;
      if(b != 0.0 || c != 0.0) {
        shift = Math.sqrt(b * b + c);
        if(b < 0.0) shift = -shift;
        shift = c / (b + shift);
      }
      f =(sl + sm) * (sl - sm) + shift;
      g = sl * el;
      //  chase zeros.
      mm1 = m - 1;
      for(k = l; k <= mm1; k++) {
        dr = drotg(f, g); f = dr[0]; g = dr[1]; cs = dr[2]; sn = dr[3];
        if(k != l) e[k - 2] = Jmat.Complex(f);
        f = cs * dreal(s[k - 1]) + sn * dreal(e[k - 1]);
        e[k - 1] = e[k - 1].mulr(cs).sub(s[k - 1].mulr(sn));
        g = sn * dreal(s[k]);
        s[k] = s[k].mulr(cs);
        if(wantv) zdrot(p, v, (k - 1) * ldv, v, k * ldv, cs, sn);
        dr = drotg(f, g); f = dr[0]; g = dr[1]; cs = dr[2]; sn = dr[3];
        s[k - 1] = Jmat.Complex(f);
        f = cs * dreal(e[k - 1]) + sn * dreal(s[k]);
        s[k] = e[k - 1].mulr(-sn).add(s[k].mulr(cs));
        g = sn * dreal(e[k]);
        e[k] = e[k].mulr(cs);
        if(wantu && k < n) zdrot(n, u, (k - 1) * ldu, u, k * ldu, cs, sn);
      }
      e[m - 2] = Jmat.Complex(f);
      iter++;
    } else if(kase == 4) {
      // convergence.
      // make the singular value positive.
      if(dreal(s[l - 1]) < 0.0) {
        s[l - 1] = s[l - 1].neg();
        if(wantv) zscal(p, Jmat.Complex(-1.0), v, (l - 1) * ldv);
      }
      // order the singular values.
      while(l != mm) {
        if(dreal(s[l]) <= dreal(s[l - 1])) break;
        t = s[l - 1];
        s[l - 1] = s[l];
        s[l] = t;
        if(wantv && l < p) zswap(p, v, (l - 1) * ldv, v, l * ldv);
        if(wantu && l < n) zswap(n, u, (l - 1) * ldu, u, l * ldu);
        l++;
      }
      iter = 0;
      m--;
    }
  }
  return info;
};
// End of Linpack zsvdc
////////////////////////////////////////////////////////////////////////////////

// Singular value decomposition with Matrix objects
// input M, returns {u: U, s: S, v: V } such that U * S * V^T = M and S diagonal with singular values (^T means conjugate transpose here)
// Input allowed to be non-square. The size of "S" is same as the input matrix.
Jmat.Matrix.svd = function(m) {
  /*
  Checks in console:
  function testSvd(m) {
    var result = Jmat.Matrix.svd(Jmat.Matrix(m));
    console.log(Jmat.toString(result) + ' | ' + Jmat.Matrix.mul(Jmat.Matrix.mul(result.u, result.s), Jmat.Matrix.transjugate(result.v)).toString());
  }
  testSvd(Jmat.Matrix(2,2,1,2,3,4))
  testSvd(Jmat.Matrix(2,2,1,2,3,4).mulc(Jmat.Complex.I))
  testSvd(Jmat.Matrix(2,2,1,2,1,2))
  testSvd(Jmat.Matrix([[1,2]]))
  testSvd(Jmat.Matrix([[1],[2]]))

  var x = Jmat.Matrix([[1,2,3,4],[5,6,7,8]]); var svd = Jmat.svd(x); 'X:\n' + Jmat.Matrix.render(x) + '\nU:\n' + Jmat.Matrix.render(svd.u) + '\nS:\n' + Jmat.Matrix.render(svd.s) + '\nV:\n' + Jmat.Matrix.render(svd.v) + '\n reconstruct: \n' + Jmat.Matrix.render(svd.u.mul(svd.s).mul(svd.v.transjugate()))
  */

  // 1D array representing the matrix
  var a = [];
  for(var y = 0; y < m.h; y++) {
    for(var x = 0; x < m.w; x++) {
      a[y + x * m.h] = m.e[y][x];
    }
  }

  var s = []; //h*w
  var u = []; //h*h
  var v = []; //w*w
  var e = []; //h*w

  // function(x, ldx, n, p, s, e, u, ldu, v, ldv, job)
  Jmat.Matrix.zsvdc_(a, m.h, m.h, m.w, s, e, u, m.h, v, m.w, [], 11);

  // Solve numerical problems: singular values < eta should be 0
  var eta = 1e-15; //TODO: check if this tolerance can be improved
  for(var i = 0; i < s.length; i++) if(Math.abs(s[i]) < eta) s[i] = 0;

  var result = { u: new Jmat.Matrix(m.h, m.h), s: new Jmat.Matrix(m.h, m.w), v: new Jmat.Matrix(m.w, m.w) };


  for(var y = 0; y < m.h; y++) {
    for(var x = 0; x < m.h; x++) {
      result.u.e[y][x] = u[y + x * m.h];
    }
  }
  for(var y = 0; y < m.h; y++) {
    for(var x = 0; x < m.w; x++) {
      result.s.e[y][x] = (x == y) ? Jmat.Complex(s[x]) : Jmat.Complex(0);
    }
  }
  for(var y = 0; y < m.w; y++) {
    for(var x = 0; x < m.w; x++) {
      result.v.e[y][x] = v[y + x * m.w];
    }
  }

  return result;
};

// equals
Jmat.Matrix.eq = function(a, b) {
  if(a.w != b.w || a.h != b.h) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      if(!a.e[y][x].eq(b.e[y][x])) return false;
    }
  }

  return true;
};

// nearly equal
Jmat.Matrix.near = function(a, b, epsilon) {
  if(a.w != b.w || a.h != b.h) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var ea = a.e[y][x];
      var eb = b.e[y][x];
      if(!Jmat.Complex.near(ea, eb, epsilon)) return false;
    }
  }

  return true;
};

// nearly equal (relative, precision determines number of decimal digits to match per number, e.g. 1e-3 for 3 digits)
Jmat.Matrix.relnear = function(a, b, precision) {
  if(a.w != b.w || a.h != b.h) return false;

  for(var y = 0; y < a.h; y++) {
    for(var x = 0; x < a.w; x++) {
      var ea = a.e[y][x];
      var eb = b.e[y][x];
      if(!Jmat.Complex.relnear(ea, eb, precision)) return false;
    }
  }

  return true;
};


//solves system of linear equations ax=b.
//Returns null if the system is inconsistent and has no solution, x otherwise.
//If multiple solutions are possible, returns the solution where the vector of free variables is 0.
//a: input matrix, h*w size (h = number of equations, w = number of unknowns)
//b: input vector, h*1 size
//result: w*1 size
//opt_epsilon: optional parameter, in case of homogenous system, how near the smallest singular value of a should be to return a solution
Jmat.Matrix.solve = function(a, b, opt_epsilon) {
  var M = Jmat.Matrix;
  if(a.h != b.h) return undefined; // input error
  var epsilon = (opt_epsilon == undefined) ? 1e-12 : opt_epsilon;

  if (M.isZero(b)) {
    // Homogenous system.
    var svd = M.svd(a);
    if (!Jmat.Complex.nearr(svd.s.e[svd.s.h - 1][svd.s.h - 1], 0, epsilon)) return null; //allow large imprecision, so that it works if eigenvector calculation is a bit imprecise.
    // A is assumed singular. Last column should correspond to singular value which is zero, corresponding to a solution.
    return M.col(svd.v, a.w - 1);
  }

  // TODO: more numerically stable algorithm?
  var ab = M.augment(a, b);
  var r = M.rref(ab);
  var result = M(a.w, 1, 0);
  var x0 = 0;
  for(var y = 0; y < r.h; y++) {
    var x = x0;
    for(; x < r.w; x++) {
      if(!r.e[y][x].eqr(0)) {
        if(x == r.w - 1) return null; // inconsistent system: row with all zeroes except in the augmented part
        result.e[x][0] = r.e[y][ab.w - 1];
        x0 = x + 1;
        break;
      }
    }
    if(x == r.w - 1) break; // done
  }
  return result;
};

// Gives the least squares solution to the (overdetermined) linear system ax=b, that is, minimizes ||ax-b||^2
Jmat.Matrix.leastSquares = function(a, b) {
  return Jmat.Matrix.pseudoinverse(a).mul(b);
};

// Returns the matrix in reduced row echolon form. Supports non-square and singular matrices. Is always the identity matrix if the input is invertible.
Jmat.Matrix.rref = function(a) {
  /*
  Check in console:
  Matrix.rref(Matrix([[1,3,1,9],[1,1,-1,1],[3,11,5,35]])).render()
  Matrix.solve(Matrix([[1,3,1],[1,1,-1],[3,11,5]]), Matrix([[9],[1],[35]])).render()
  */
  var C = Jmat.Complex;
  var h = a.h;
  var w = a.w;
  a = Jmat.Matrix.copy(a); // The rest all works in-place, so copy to not modify user input.

  //swaps rows y0 and y1 in place
  var swaprow = function(a, y0, y1) {
    for (var i = 0; i < w; i++) {
      var temp = a.e[y0][i]; a.e[y0][i] = a.e[y1][i]; a.e[y1][i] = temp;
    }
  };

  // only starts at x rather than from the beginning
  var mulrow = function(a, x, y, v) {
    for (var i = x; i < w; i++) {
      a.e[y][i] = a.e[y][i].mul(v);
    }
  };

  // subtracts a multiple of row y0 from row y1, modifying y1. Only starts at x rather than from the beginning
  var submul = function(a, x, y0, v, y1) {
    var w = a.e[0].length;
    for (var i = x; i < w; i++) {
      a.e[y1][i] = a.e[y1][i].sub(a.e[y0][i].mul(v));
    }
  };

  var pivots = []; // x coordinate of pivot in each row (except the zero rows at the end, so may have smaller length than h)

  // gaussian elimination
  var k2 = 0; //next row to fill in, equal to k unless there are zero-rows
  for(var k = 0; k < w; k++) {
    var n = Jmat.Real.argmax(k2, h, function(i) { return a.e[i][k].abssq(); });
    if (a.e[n][k].eqr(0)) continue; // singular, no pivot for this column
    if(n != k2) swaprow(a, k2, n);
    mulrow(a, k, k2, a.e[k2][k].inv()); // pivot is now 1
    // make corresponding elements of row below zero using row operations
    for (var i = k2 + 1; i < h; i++) {
      if(!(a.e[i][k].eqr(0))) {
        submul(a, k + 1, k2, a.e[i][k], i);
        a.e[i][k] = C(0); // make extra-sure it's 0, avoid numerical imprecision
      }
    }
    pivots.push(k);
    k2++;
    if(k2 >= h) break;
  }

  //now bring from row echolon form to reduced row echolon form
  for(var k = 0; k < pivots.length; k++) {
    var p = pivots[k];
    // make corresponding elements of row above zero using row operations
    for(var y = k - 1; y >= 0; y--) {
      if(!(a.e[y][p].eqr(0))) {
        submul(a, p + 1, k, a.e[y][p], y);
        a.e[y][p] = C(0); // make extra-sure it's 0, avoid numerical imprecision
      }
    }
  }

  return a;
};

// generates a random matrix with some properties.
// all parameters are optional.
// properties: properties object similar to what "getProperties" returns. Not all are implemented though.
//             Currently only 'real', 'integer', 'binary' and 'hermitian' are supported.
//             Default is object {'real':true}. Pass "undefined" to get the default, or '{}' to get complex matrices.
// h: number of rows. Default: random 2..12
// w: number of columns. Default: random 2..12, or h if h is defined
// r0: lowest random value. Default: 0
// r1: highest random value. Default: 1
// s: sparseness: give value in range 0-1. Default: 1
// e.g. Matrix.random(4, 4, 0, 10, 1, {'integer':true}).render_summary()
//      Matrix.random(3, 3, -10, 10, 1, {'real':false,'hermitian':true}).render_summary()
Jmat.Matrix.random = function(properties, h, w, r0, r1, s) {
  var C = Jmat.Complex;
  w = w || h || Math.floor(Math.random() * 10 + 2);
  h = h || Math.floor(Math.random() * 10 + 2);
  s = (s == undefined) ? 1 : s;
  r0 = (r0 == undefined) ?  0 : r0;
  r1 = (r1 == undefined) ?  1 : r1;
  properties = properties || {'real':true};
  var real = properties['real'] || properties['integer'];
  var integer = properties['integer'];
  var binary = properties['binary'];
  var hermitian = properties['hermitian'];
  var f = function(real) {
    if(s >= 1 || Math.random() < s) {
      if (binary) return Math.random() > 0.5 ? C(1) : C(0);
      var result = real ? C(Math.random() * (r1 - r0) + r0) : C.random(r0, r1);
      return integer ? C(Math.floor(result.re)) : result;
    }
    return C(0);
  };

  var result = Jmat.Matrix(h, w);
  for(var y = 0; y < h; y++) {
    for(var x = 0; x < w; x++) {
      if(hermitian && y > x) result.e[y][x] = result.e[x][y].conj();
      else if(hermitian && x == y) result.e[y][x] = f(true);
      else result.e[y][x] = f(real);
    }
  }

  return result;
};

Jmat.Matrix.matrixfft_ = function(m, inverse) {
  var rowresult = new Jmat.Matrix(m.h, m.w);

  // apply to each row
  if(m.w > 1) {
    for(var j = 0; j < m.h; j++) {
      var fft = Jmat.Complex.fft(m.e[j], inverse);
      for(var i = 0; i < m.w; i++) rowresult.e[j][i] = fft[i];
    }
  } else {
    rowresult = m;
  }

  var result = new Jmat.Matrix(m.h, m.w);

  // apply to each column
  if (m.h > 1) {
    for(var j = 0; j < m.w; j++) {
      var col = Jmat.Matrix.transpose(Jmat.Matrix.col(rowresult, j));
      var fft = Jmat.Complex.fft(col.e[0], inverse);
      for(var i = 0; i < m.h; i++) result.e[i][j] = fft[i];
    }
  } else {
    result = rowresult;
  }

  return result;
};

// Discrete fourier transform
Jmat.Matrix.fft = function(m) {
  // Debug in console:
  // Jmat.Matrix.toString(Jmat.Matrix.fft(Jmat.Matrix(2,2,1,2,3,4)))
  // should give [5 -1][-2 0]
  return Jmat.Matrix.matrixfft_(m, 0);
};

// Inverse discrete fourier transform
Jmat.Matrix.ifft = function(m) {
  return Jmat.Matrix.matrixfft_(m, 1);
};


//Matrix exponential
Jmat.Matrix.exp = function(m) {
  if(m.h != m.w) return null; //must be square

  var result = m.add(Jmat.Matrix.identity(m.w, m.w));
  var mm = m;
  var k = 1;

  // TODO: quit early if convergence reached
  for(var i = 2; i <= 20; i++) {
    k *= i;
    mm = mm.mul(m);
    result = result.add(mm.mulr(1 / k));
  }

  return result;
};

/*
Matrix cosine

debug in console:
var a = Jmat.Matrix(2,2,1,2,3,4);
var c = Jmat.Matrix.cos(a); var s = Jmat.Matrix.sin(a);
Jmat.Matrix.toString(c) + ' ' + Jmat.Matrix.toString(s) + ' ' + Jmat.Matrix.toString(c.mul(c).add(s.mul(s)));
--> c*c+s*s should give identity matrix
*/
Jmat.Matrix.cos = function(m) {
  if(m.h != m.w) return null; //must be square

  var result = Jmat.Matrix.identity(m.w, m.w);
  var mm = m.mul(m);
  var mmm = null;
  var k = 1;
  var sign = 1;

  // TODO: quit early if convergence reached
  for(var i = 0; i < 20; i++) {
    if(i == 0) {
      k = 2;
    } else {
      k *= (i * 2 + 1) * (i * 2 + 2); //e.g. when i = 1, k is (4!)
    }

    sign = -sign;
    mmm = (mmm == null) ? mm : mmm.mul(mm);
    result = result.add(mmm.mulr(sign / k));
  }

  return result;
};

// Matrix sine
Jmat.Matrix.sin = function(m) {
  if(m.h != m.w) return null; //must be square

  var result = m;
  var mm = m.mul(m);
  var mmm = m;
  var k = 1;
  var sign = 1;

  // TODO: quit early if convergence reached
  for(var i = 0; i < 20; i++) {
    k *= (i * 2 + 2) * (i * 2 + 3); //e.g. when i = 1, k is (5!)

    sign = -sign;
    mmm = mmm.mul(mm);
    result = result.add(mmm.mulr(sign / k));
  }

  return result;
};

// Square root of matrix (returns a such that a * a = m)
// debug in console: var a = Jmat.Matrix.sqrt(Jmat.Matrix(3,3,1,1,0,0,0,1,1,0,1)); Jmat.Matrix.toString(a) + ' ' + Jmat.Matrix.toString(a.mul(a))
Jmat.Matrix.sqrt = function(m) {
  if(m.h != m.w) return null; //must be square

  // Babylonian method. Does not work for [[1,2][3,4]], because that one has complex result. Left commented out for demonstration purpose only.
  /*var result = m.add(Jmat.Matrix.identity(m.w, m.w)).mulr(0.5);
  for(var i = 0; i <= 30; i++) {
    result = result.add(m.div(result)).mulr(0.5);
  }
  return result;*/

  // With eigen decomposition: only the sqrt of the diagonals of D needs to be taken
  // TODO: this will only work for diagonizable matrix. Implement a way for non-diagonizable one as well (with Jordan normal form)
  var e = Jmat.Matrix.evd(m);
  var v = e.v;
  var d = e.d;
  for(var i = 0; i < d.w; i++) d.e[i][i] = Jmat.Complex.sqrt(d.e[i][i]);
  return v.mul(d).mul(Jmat.Matrix.inv(v));
};

// Matrix logarithm (base e, ln)
// debug in console: var a = Jmat.Matrix.log(Jmat.Matrix(2,2,1,2,3,4)); Jmat.Matrix.toString(a) + ' ' + Jmat.Matrix.toString(Jmat.Matrix.exp(a))
Jmat.Matrix.log = function(m) {
  if(m.h != m.w) return null; //must be square

  // With eigen decomposition: only the log of the diagonals of D needs to be taken
  // TODO: this will only work for diagonizable matrix. Implement a way for non-diagonizable one as well (with Jordan normal form)
  var e = Jmat.Matrix.evd(m);
  var v = e.v;
  var d = e.d;
  for(var i = 0; i < d.w; i++) d.e[i][i] = Jmat.Complex.log(d.e[i][i]);
  return v.mul(d).mul(Jmat.Matrix.inv(v));
};

// Matrix to any complex scalar power s
Jmat.Matrix.powc = function(m, s) {
  if(m.h != m.w) return null; //must be square

  // With eigen decomposition: only the log of the diagonals of D needs to be taken
  // TODO: this will only work for diagonizable matrix. Implement a way for non-diagonizable one as well (with Jordan normal form)
  var e = Jmat.Matrix.evd(m);
  var v = e.v;
  var d = e.d;
  for(var i = 0; i < d.w; i++) d.e[i][i] = d.e[i][i].pow(s);
  return v.mul(d).mul(Jmat.Matrix.inv(v));
};



//because js is evil:
//ensures that map exists
if (!Array.prototype.map)
{
   Array.prototype.map = function(fun /*, thisp*/)
   {
      var len = this.length;
      
      if (typeof fun != "function")
      throw new TypeError();
      
      var res = new Array(len);
      var thisp = arguments[1];
      
      for (var i = 0; i < len; i++)
      {
         if (i in this)
         res[i] = fun.call(thisp, this[i], i, this);
      }
      return res;
   };
}
//my stuff
var thereToOur = function(c){
    return { re:c.re, im:c.im}
};

var cVector = function(cvector){
    var map = Array.prototype.map;
    var ourToThere = x => Jmat.Complex(x.re, x.im);
    return map.call(cvector,ourToThere)
};

var reverseCVector = function(vector){
    var map = Array.prototype.map;
    return map.call(vector,thereToOur)
};

var cMatrix = function(cmatrix){
    var map = Array.prototype.map;
    return map.call(cmatrix,cVector)

};
//Taken from elm's list implementation:
function toArray(xs)
{
    var out = [];
    while (xs.ctor !== '[]')
    {
	out.push(xs._0);
	xs = xs._1;
    }
    return out;
}

var Nil = { ctor: '[]' };

function Cons(hd, tl)
{
    return {
	ctor: '::',
	_0: hd,
	_1: tl
    };
}

function list(arr)
{
    var out = Nil;
    for (var i = arr.length; i--; )
    {
	out = Cons(arr[i], out);
    }
    return out;
}
//my stuff:
var eigens = function(cmatrix){
    //converts from a elm list to a js array:
    var acc = []
    var jsarray = toArray(cmatrix);
    var n = jsarray.length;
    for(var i = 0; i < n; i++){
        acc.push(toArray(jsarray[i]))
    }

    var crap = cMatrix(acc)    //converts our complex numbers to the Jmat complex type
    var matrix = Jmat.Matrix(crap) //creates the matrix
    var eigens = Jmat.Matrix.eig(matrix) //eigen info
    var eigenvals = list(eigens.l.map(thereToOur)) //creates a list of eigen values in our complex type
    var eigencols = list(((eigens.v.e).map(reverseCVector)).map(list))
    return {values:eigenvals, cols: eigencols}
    //return list((cMatrix(acc)).map(list))
};



// make is a function that takes an instance of the 
// elm runtime 
// returns an object where:
//      keys are names to be accessed in pure Elm
//      values are either functions or values
var make = function make(elm) {
    // If Native isn't already bound on elm, bind it!
//    import * as numeric from 'numeric-1.2.6'
    elm.Native = elm.Native || {};
    // then the same for our module
    elm.Native.CostlyLinear = elm.Native.CostlyLinear || {};

    // `values` is where the object returned by make ends up internally
    // return if it's already set, since you only want one definition of 
    // values for speed reasons
    if (elm.Native.CostlyLinear.values) return elm.Native.CostlyLinear.values;

    // return the object of your module's stuff!
    return elm.Native.CostlyLinear.values = {'eigens' : eigens};
};

// setup code for MyModule
// Elm.Native.MyModule should be an object with
// a property `make` which is specified above
Elm.Native.CostlyLinear = {};
Elm.Native.CostlyLinear.make = make;




