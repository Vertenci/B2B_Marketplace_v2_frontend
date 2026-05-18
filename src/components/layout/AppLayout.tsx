import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { companyService } from '../../services/companyService';
import { driverService } from '../../services/driverService';
import type { Company } from '../../types';

interface AppLayoutProps {
  companyType: 'lessor' | 'renter' | 'driver' | null;
}

export const AppLayout = ({ companyType }: AppLayoutProps) => {
  const { activeCompany, setActiveCompany } = useAuthStore();
  const navigate = useNavigate();
  const params = useParams<{ companyId?: string }>();

  // Загружаем список компаний нужного типа
  const { data: lessorCompanies } = useQuery({
    queryKey: ['lessor-companies'],
    queryFn: companyService.getMyLessorCompanies,
    enabled: companyType === 'lessor',
  });

  const { data: renterCompanies } = useQuery({
    queryKey: ['renter-companies'],
    queryFn: companyService.getMyRenterCompanies,
    enabled: companyType === 'renter',
  });

  useQuery({
    queryKey: ['driver-company'],
    queryFn: driverService.getMyCompany,
    enabled: companyType === 'driver',
  });

  const companies = companyType === 'lessor' ? lessorCompanies : renterCompanies;

  // Определяем активную компанию из URL или store
  const currentCompanyId = params.companyId;
  const currentCompany = companies?.find(c => c.id === currentCompanyId) || activeCompany;

  const handleSelectCompany = (company: Company) => {
    setActiveCompany(company);
    if (companyType === 'lessor') navigate(`/lessor/${company.id}/dashboard`);
    if (companyType === 'renter') navigate(`/renter/${company.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[#111827] flex">
      <Sidebar
        companyType={companyType}
        companies={companies}
        activeCompany={currentCompany || null}
        onSelectCompany={handleSelectCompany}
      />
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
