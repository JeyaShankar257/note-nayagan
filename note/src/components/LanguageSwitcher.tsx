import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <div className="flex justify-end p-4 gap-2">
      <Button size="sm" onClick={() => i18n.changeLanguage("en")}>EN</Button>
      <Button size="sm" onClick={() => i18n.changeLanguage("ta")}>தமிழ்</Button>
      <Button size="sm" onClick={() => i18n.changeLanguage("te")}>తెలుగు</Button>
      <Button size="sm" onClick={() => i18n.changeLanguage("fr")}>FR</Button>
    </div>
  );
}
