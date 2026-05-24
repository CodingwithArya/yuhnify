"use client";

import type { Units } from "@/lib/units";
import type {
  BiologicalSex,
  PreviousRace,
  RunningExperience,
  UserProfile,
  WeeklyMileage,
} from "@/types/profile";
import { getWeeklyMileageOptions } from "@/lib/user-profile";
import { HealthConditionsFields } from "@/components/profile/HealthConditionsFields";

const inputClass =
  "w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50";
const labelClass = "block text-sm text-[#71717a] mb-1.5";
const helperClass = "text-xs text-[#71717a] mt-1";

interface ProfileFieldsProps {
  profile: UserProfile;
  onChange: (patch: Partial<UserProfile>) => void;
  disabled?: boolean;
  variant?: "full" | "basic" | "background";
}

export function ProfileFields({
  profile,
  onChange,
  disabled = false,
  variant = "full",
}: ProfileFieldsProps) {
  const mileageOptions = getWeeklyMileageOptions(profile.units);
  const showBasic = variant === "full" || variant === "basic";
  const showBackground = variant === "full" || variant === "background";
  const showUnits = variant === "full";
  const showPrimaryGoal = variant === "full";
  const showHealthConditions = variant === "full";

  return (
    <div className="space-y-4">
      {showBasic && (
        <>
          <div>
            <label htmlFor="profile-first-name" className={labelClass}>
              First name
            </label>
            <input
              id="profile-first-name"
              type="text"
              required
              value={profile.firstName}
              disabled={disabled}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="profile-age" className={labelClass}>
              Age (optional)
            </label>
            <input
              id="profile-age"
              type="number"
              min={10}
              max={100}
              placeholder="e.g. 35"
              value={profile.age ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  age: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className={inputClass}
            />
            <p className={helperClass}>Used for accurate heart rate zones</p>
          </div>

          <div>
            <label htmlFor="profile-sex" className={labelClass}>
              Biological sex (optional)
            </label>
            <select
              id="profile-sex"
              value={profile.biologicalSex ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  biologicalSex: (e.target.value || undefined) as
                    | BiologicalSex
                    | undefined,
                })
              }
              className={inputClass}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            <p className={helperClass}>Helps calibrate HR zones</p>
          </div>

          <div>
            <label htmlFor="profile-perinatal" className={labelClass}>
              Are you currently pregnant or postpartum (within 12 months of giving birth)?
            </label>
            <select
              id="profile-perinatal"
              value={profile.perinatalStatus ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  perinatalStatus: (e.target.value || undefined) as
                    | UserProfile["perinatalStatus"]
                    | undefined,
                })
              }
              className={inputClass}
            >
              <option value="no">No</option>
              <option value="pregnant">Yes, pregnant</option>
              <option value="postpartum_under_6">Yes, postpartum (under 6 months)</option>
              <option value="postpartum_6_12">Yes, postpartum (6-12 months)</option>
            </select>
          </div>
        </>
      )}

      {showHealthConditions && (
        <HealthConditionsFields
          value={profile.healthConditions}
          onChange={(healthConditions) => onChange({ healthConditions })}
          disabled={disabled}
          subtext="Helps your coach adjust training safely"
        />
      )}

      {showUnits && (
        <fieldset>
          <legend className={`${labelClass} mb-2`}>Units preference</legend>
          <div className="flex gap-4">
            {(["mi", "km"] as Units[]).map((unit) => (
              <label
                key={unit}
                className="flex items-center gap-2 text-sm text-white cursor-pointer"
              >
                <input
                  type="radio"
                  name="profile-units"
                  value={unit}
                  checked={profile.units === unit}
                  disabled={disabled}
                  onChange={() => onChange({ units: unit })}
                  className="accent-[#f97316]"
                />
                {unit === "mi" ? "Miles" : "Kilometers"}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {showBackground && (
        <>
          <div>
            <label htmlFor="profile-mileage" className={labelClass}>
              Current weekly mileage
            </label>
        <select
          id="profile-mileage"
          value={profile.currentWeeklyMileage ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              currentWeeklyMileage: (e.target.value || undefined) as
                | WeeklyMileage
                | undefined,
            })
          }
          className={inputClass}
        >
          <option value="">Select</option>
          {mileageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="profile-experience" className={labelClass}>
          Running experience
        </label>
        <select
          id="profile-experience"
          value={profile.runningExperience ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              runningExperience: (e.target.value || undefined) as
                | RunningExperience
                | undefined,
            })
          }
          className={inputClass}
        >
          <option value="">Select</option>
          <option value="just_starting">Just starting out</option>
          <option value="1_2_years">1-2 years</option>
          <option value="3_5_years">3-5 years</option>
          <option value="5_plus_years">5+ years</option>
        </select>
      </div>

      <div>
        <label htmlFor="profile-previous-race" className={labelClass}>
          Previous half marathon or marathon?
        </label>
        <select
          id="profile-previous-race"
          value={profile.previousRace ?? ""}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              previousRace: (e.target.value || undefined) as
                | PreviousRace
                | undefined,
            })
          }
          className={inputClass}
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
          </div>
        </>
      )}

      {showPrimaryGoal && (
        <div>
          <label htmlFor="profile-primary-goal" className={labelClass}>
            What is your main goal right now?
          </label>
          <input
            id="profile-primary-goal"
            type="text"
            maxLength={200}
            placeholder="e.g. finish my first half marathon, run sub 2 hours, lose weight while training, just stay consistent this year"
            value={profile.primaryGoal ?? ""}
            disabled={disabled}
            onChange={(e) => onChange({ primaryGoal: e.target.value })}
            className={inputClass}
          />
          <p className={helperClass}>
            Write anything. Your AI coach will read this directly.
          </p>
        </div>
      )}
    </div>
  );
}
