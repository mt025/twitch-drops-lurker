export function waitAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

//https://www.tutorialspoint.com/generate-random-string-characters-in-javascript
export function generateRandomString(numberOfCharacters) {
  var randomValues = '';
  var stringValues = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';  
  var sizeOfCharacter = stringValues.length;  
for (var i = 0; i < numberOfCharacters; i++) {
     randomValues = randomValues+stringValues.charAt(Math.floor(Math.random() * sizeOfCharacter));
  }
  return randomValues;
} 