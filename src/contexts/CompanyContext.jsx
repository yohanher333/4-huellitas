import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/customSupabaseClient';

const CompanyContext = createContext(null);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

// Función para actualizar favicon y meta tags dinámicamente
const updateFaviconAndMeta = (logoUrl) => {
  if (!logoUrl) return;

  // Actualizar favicon
  let favicon = document.querySelector("link[rel='icon']");
  if (favicon) {
    favicon.href = logoUrl;
  } else {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = logoUrl;
    document.head.appendChild(favicon);
  }

  // Actualizar meta tags para compartir (Open Graph)
  const updateOrCreateMeta = (property, content) => {
    let meta = document.querySelector(`meta[property='${property}']`);
    if (meta) {
      meta.content = content;
    } else {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      meta.content = content;
      document.head.appendChild(meta);
    }
  };

  // Actualizar og:image para cuando se comparte el link
  updateOrCreateMeta('og:image', logoUrl);
  updateOrCreateMeta('og:image:alt', '4huellitas Logo');
  
  // Twitter Card
  let twitterImage = document.querySelector("meta[name='twitter:image']");
  if (twitterImage) {
    twitterImage.content = logoUrl;
  } else {
    twitterImage = document.createElement('meta');
    twitterImage.name = 'twitter:image';
    twitterImage.content = logoUrl;
    document.head.appendChild(twitterImage);
  }
};

export const CompanyProvider = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .maybeSingle();

      if (!error && data) {
        setCompanyInfo(data);
      }
    } catch (err) {
      console.error('Error loading company info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  // Actualizar favicon y meta tags cuando cambie el logo
  useEffect(() => {
    if (companyInfo?.logo) {
      updateFaviconAndMeta(companyInfo.logo);
    }
  }, [companyInfo?.logo]);

  const refreshCompanyInfo = () => {
    fetchCompanyInfo();
  };

  // Logo desde la configuración de la empresa
  const logo = companyInfo?.logo || '';

  return (
    <CompanyContext.Provider value={{ companyInfo, logo, loading, refreshCompanyInfo }}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;
