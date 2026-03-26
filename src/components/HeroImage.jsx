import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';

const HeroImage = () => {
  const { logo } = useCompany();
  return <div className='flex justify-center items-center'>
      <img src={logo} alt='4huellitas Logo' />
    </div>;
};
export default HeroImage;