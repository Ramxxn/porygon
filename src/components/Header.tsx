
export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-18 max-w-375 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img className="h-11 w-11 rounded-xl object-cover" src="/porygon.png" alt="" />
          <div>
            <h1 className="text-base font-bold tracking-tight">Porygon</h1>
            <p className="text-xs text-gray-500">Shipping label studio</p>
          </div>
        </div>

      </div>
    </header>
  );
}
