import React from "react";
import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "./Buttons";

export const SkeletonCard: React.FC = () => (
  <div className="flex flex-col rounded-xl bg-[#161B22] border border-[#21262D] overflow-hidden p-3 space-y-3">
    <div className="bko-skeleton aspect-square w-full rounded-lg" />
    <div className="bko-skeleton h-4 w-3/4" />
    <div className="bko-skeleton h-3 w-1/2" />
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, actionHref, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl bg-[#161B22] border border-[#21262D] my-6">
    <div className="w-14 h-14 rounded-full bg-[#1F242D] text-[#8B949E] flex items-center justify-center text-2xl mb-4">
      📻
    </div>
    <h3 className="text-lg font-bold text-[#F0F6FC]">{title}</h3>
    <p className="text-sm text-[#8B949E] mt-1.5 max-w-md">{description}</p>
    {actionLabel && (
      <div className="mt-6">
        {actionHref ? (
          <Link href={actionHref}>
            <PrimaryButton>{actionLabel}</PrimaryButton>
          </Link>
        ) : (
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
        )}
      </div>
    )}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = "Impossible de charger ces informations pour le moment.",
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-[#161B22] border border-[#DA3633]/30 my-6">
    <div className="w-12 h-12 rounded-full bg-[#DA3633]/10 text-[#DA3633] flex items-center justify-center text-xl mb-3">
      ⚠️
    </div>
    <h3 className="text-base font-bold text-[#F0F6FC]">Une erreur est survenue</h3>
    <p className="text-sm text-[#8B949E] mt-1 max-w-sm">{message}</p>
    {onRetry && (
      <div className="mt-4">
        <SecondaryButton onClick={onRetry} size="sm">
          Réessayer
        </SecondaryButton>
      </div>
    )}
  </div>
);
