const Logo = () => {
  return (
    <div className="flex items-center">
      <img src="/logo-light.svg" alt="PeerLearn Logo" className="h-10 w-auto block dark:hidden" />
      <img src="/logo-dark.svg" alt="PeerLearn Logo" className="h-10 w-auto hidden dark:block" />
    </div>
  );
};

export default Logo;