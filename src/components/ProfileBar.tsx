import { MEMBER_WINDOW_DAYS, PUBLIC_WINDOW_DAYS, planById } from '../lib/catalog';
import { membershipState } from '../lib/rules';
import { actions, useNow, useProfile, useStore } from '../lib/store';
import { Icon } from './Icon';
import { initials } from './ui';

/** Selector de perfil de la demo (no hay login real): público general o un miembro. */
export function ProfileBar() {
  const s = useStore();
  const member = useProfile();
  const now = useNow();
  const state = member ? membershipState(member, now) : null;

  return (
    <div className="profile-bar">
      <div className="who">
        <span className="avatar">{member ? initials(member.name) : <Icon name="user" size={18} />}</span>
        <div style={{ minWidth: 0 }}>
          <label htmlFor="profile">Estás usando la app como</label>
          <select id="profile" value={s.profile} onChange={(e) => actions.setProfile(e.target.value)}>
            <option value="public">Público general</option>
            <optgroup label="Miembros del club">
              {s.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {planById(m.planId).name}
                  {membershipState(m, now) === 'expired' ? ' (vencida)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
      <div className="perk">
        {member && state !== 'expired' ? (
          <>
            <Icon name="crown" size={18} /> Agenda prioritaria · {MEMBER_WINDOW_DAYS} días
          </>
        ) : (
          <>
            <Icon name="lock" size={16} /> Agenda abierta {PUBLIC_WINDOW_DAYS} días ·{' '}
            <a href="#/unirme" style={{ color: '#fff' }}>
              miembros {MEMBER_WINDOW_DAYS}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
