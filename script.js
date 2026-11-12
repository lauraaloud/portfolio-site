
// variables
let name = 'Laura'
const major = 'Computer Science'

console.log(name)
console.log(major)

// function declaration
function greetUser(name) {
  return 'Hello, ' + name + '!'
}

console.log(greetUser(name))

// function expression
const functionExpression =
    function() {
  console.log('This is a function expression')
}

// arrow function
const arrowFunction =
    () => {
      console.log('This is an arrow function')
    }

// test the functions
functionExpression()
arrowFunction()

// wait until the page loads
window.onload = function() {
  // demo 6: scrollreveal
  if (typeof ScrollReveal !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ScrollReveal().reveal(
        '#about, #projects, #contact',
        {delay: 200, duration: 800, distance: '20px', origin: 'bottom'})
  }
}
