export function highlightFirstWord(text: string, className: string) {
  const [firstWord, ...rest] = text.split(" ");
  return (
    <>
      <span className={className}>{firstWord}</span> {rest.join(" ")}
    </>
  );
}
