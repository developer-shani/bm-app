// Convert number to Roman Urdu words for Pakistani currency
export function amountToUrduWords(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
  if (isNaN(num) || num <= 0) return "";

  const ones = ["", "Ek", "Do", "Teen", "Chaar", "Paanch", "Chhe", "Saat", "Aath", "Nau"];
  const tens = ["", "", "Bees", "Tees", "Chaalees", "Pachaas", "Saath", "Sattar", "Assi", "Nabbe"];
  const teens = ["Das", "Gyarah", "Baarah", "Terah", "Chaudah", "Pandrah", "Solah", "Satrah", "Atharah", "Unees"];

  function convertSmall(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return o > 0 ? tens[t] + " " + ones[o] : tens[t];
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const remainder = n % 100;
      const hundredWord = h === 1 ? "Ek Sau" : ones[h] + " Sau";
      return remainder > 0 ? hundredWord + " " + convertSmall(remainder) : hundredWord;
    }
    return "";
  }

  if (num >= 10000000) {
    const crore = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    const croreWord = crore === 1 ? "Ek Crore" : convertSmall(crore) + " Crore";
    return remainder > 0 ? croreWord + " " + amountToUrduWords(remainder) : croreWord;
  }
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    const remainder = num % 100000;
    const lakhWord = lakh === 1 ? "Ek Lakh" : convertSmall(lakh) + " Lakh";
    return remainder > 0 ? lakhWord + " " + amountToUrduWords(remainder) : lakhWord;
  }
  if (num >= 1000) {
    const hazar = Math.floor(num / 1000);
    const remainder = num % 1000;
    const hazarWord = hazar === 1 ? "Ek Hazar" : convertSmall(hazar) + " Hazar";
    return remainder > 0 ? hazarWord + " " + amountToUrduWords(remainder) : hazarWord;
  }
  return convertSmall(num);
}
