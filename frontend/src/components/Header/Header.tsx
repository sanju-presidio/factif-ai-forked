import darkLogo from '../../assets/hai-build-dark-logo.png';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-background/95 backdrop-blur-md py-3 shadow-md z-50 transition-all duration-200 border-b border-border/40">
      <div className="px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl text-white font-normal">FACTIF AI</h2>
        </div>
        <img src={darkLogo} alt="HAI Build Logo" className="h-6 w-auto" />
      </div>
    </header>
  )
}
