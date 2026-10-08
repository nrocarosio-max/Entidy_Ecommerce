function PoliciesPopper({ isOpenPoliciesPopper, onClose }: any) {
 if (!isOpenPoliciesPopper) return null;
 return (
  <div className={`fixed top-20 left-0 right-0 bg-black/70 z-40 ${isOpenPoliciesPopper ? "translate-x-0" : "-translate-x-full"}`}>
   {/* Popup */}
   <div className="fixed top-0 left-0 right-0 z-50 bg-white w-full lg:w-2/3 mx-auto my-5 p-4 md:p-10 lg:p-20 rounded-lg ">
    {/* Click close Popup */}
    <button
     onClick={() => {
      onClose();
     }}
     className={`absolute right-2 top-2 ml-4
                w-12 h-12 rounded-full border
                flex items-center justify-center bg-white inset-shadow-2xs `}>
     X
    </button>
    <div className="flex flex-col gap-8 text-[rgb(33 33 33)]">
     <h2 className="text-2xl font-bold text-bold">Rolex pricing policies</h2>

     <p className="">
      Suggested retail price inclusive of V.A.T. <br />
      The suggested price can be modified at any time without notice.
     </p>
     <p>
      The sale of Rolex watches above the suggested retail price, as well as any tie-in sale, is not permitted. However, the distribution of Rolex watches
      worldwide is entrusted to independent Official Retailers and Rolex is not authorized to intervene in the relationship between them and the end customer.
     </p>
    </div>

    <div className="flex flex-col gap-8 text-[rgb(33 33 33)]">
     <h2 className="text-2xl font-bold text-bold">Models availability</h2>

     <p className="">
      All Rolex watches are assembled by hand with the utmost care to ensure exceptional quality. Such high standards naturally restrict our production capacity
      and, at times, the demand for our watches outpaces this capacity.
     </p>
     <p>
      Therefore, the availability of certain models may be limited. New Rolex watches are exclusively sold by Official Rolex Retailers, who receive regular
      deliveries and independently manage the allocation and sales of watches to customers.
     </p>
     <p>Official Rolex Retailers can provide information on the availability of Rolex watches.</p>
    </div>
   </div>
  </div>
 );
}

export default PoliciesPopper;
