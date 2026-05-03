const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/80 bg-card px-4 py-3 text-left text-xs text-muted-foreground md:px-8 lg:px-12">
      <p>SIMANDAYA · MAN 2 Yogyakarta</p>
      <p className="mt-1">Dikelola oleh PT Sheen Studio Indonesia · {year}</p>
    </footer>
  );
};

export default Footer;
