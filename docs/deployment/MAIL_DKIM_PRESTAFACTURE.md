# Mail prestafacture.com — DKIM et délivrabilité

Contexte : l'application envoie bien les emails (SMTP `250 queued`, logs `[EmailService] Email envoyé`). Si Gmail ne reçoit rien, le blocage est côté **authentification DNS** (DKIM absent, DMARC strict).

Serveur SMTP : `mail.prestafacture.com` (IP `89.159.124.25`).

## 1. Assouplir le DMARC (immédiat, 5 min)

En attendant DKIM, remplace le record TXT `_dmarc.prestafacture.com` par :

```txt
v=DMARC1; p=none; adkim=r; aspf=r; rua=mailto:contact@prestafacture.com
```

- `adkim=r` et `aspf=r` : mode relaxed (tolère un léger décalage SPF/DKIM).
- `p=none` : observation seulement, pas de rejet DMARC.

Propagation DNS : 5 à 60 minutes. Puis reteste un envoi.

## 2. OpenDKIM sur le serveur mail

À exécuter **en SSH sur le serveur** qui héberge Postfix (`mail.prestafacture.com`).

### Installation

```bash
sudo apt update
sudo apt install -y opendkim opendkim-tools
```

### Clé DKIM (sélecteur `default`)

```bash
sudo mkdir -p /etc/opendkim/keys/prestafacture.com
sudo opendkim-genkey -b 2048 -d prestafacture.com -s default -D /etc/opendkim/keys/prestafacture.com
sudo chown -R opendkim:opendkim /etc/opendkim/keys
```

La clé publique est dans :

`/etc/opendkim/keys/prestafacture.com/default.txt`

### Fichiers OpenDKIM

`/etc/opendkim/TrustedHosts` :

```txt
127.0.0.1
localhost
89.159.124.25
mail.prestafacture.com
prestafacture.com
```

`/etc/opendkim/KeyTable` :

```txt
default._domainkey.prestafacture.com prestafacture.com:default:/etc/opendkim/keys/prestafacture.com/default.private
```

`/etc/opendkim/SigningTable` :

```txt
*@prestafacture.com default._domainkey.prestafacture.com
```

`/etc/opendkim.conf` (extraits utiles) :

```ini
Syslog                  yes
UMask                   002
Mode                    sv
Canonicalization        relaxed/simple
Domain                  prestafacture.com
Selector                default
KeyFile                 /etc/opendkim/keys/prestafacture.com/default.private
KeyTable                /etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable
ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
Socket                  inet:8891@localhost
UserID                  opendkim
```

### Postfix (milter)

Dans `/etc/postfix/main.cf`, ajouter ou vérifier :

```ini
milter_default_action = accept
milter_protocol = 6
smtpd_milters = inet:localhost:8891
non_smtpd_milters = inet:localhost:8891
```

Redémarrage :

```bash
sudo systemctl enable opendkim
sudo systemctl restart opendkim
sudo systemctl restart postfix
sudo systemctl status opendkim
```

### Record DNS DKIM

Copier le contenu de `default.txt` (sans guillemets ni retours ligne au milieu) dans un record TXT :

- **Nom** : `default._domainkey.prestafacture.com`
- **Type** : TXT
- **Valeur** : `v=DKIM1; k=rsa; p=MIIBIjANBgkqh...` (tout sur une ligne)

## 3. Records DNS de référence

| Record | Exemple |
|--------|---------|
| SPF (`prestafacture.com`) | `v=spf1 ip4:89.159.124.25 a:mail.prestafacture.com -all` |
| DKIM | `default._domainkey.prestafacture.com` → clé générée ci-dessus |
| DMARC | voir section 1, puis en durcissant plus tard : `p=quarantine` |

Vérification (depuis n'importe quelle machine) :

```bash
dig +short TXT prestafacture.com
dig +short TXT default._domainkey.prestafacture.com
dig +short TXT _dmarc.prestafacture.com
```

Test de délivrabilité : envoyer un mail à une adresse fournie par [mail-tester.com](https://www.mail-tester.com/) (objectif : 9/10 ou 10/10).

## 4. Configuration applicative (node10 prod)

Fichier : `/opt/facturio/server/.env`

```env
SMTP_HOST=mail.prestafacture.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=facture@prestafacture.com
SMTP_PASS=...
MAIL_FROM=no-reply@prestafacture.com
MAIL_FROM_NAME=PrestaFacture
MAIL_FROM_INVOICE=facture@prestafacture.com
MAIL_FROM_QUOTE=devis@prestafacture.com
PUBLIC_APP_URL=https://prestafacture.com
```

Contrôles sur node10 :

```bash
grep -E '^SMTP_|^MAIL_FROM' /opt/facturio/server/.env
cd /opt/facturio/server
node scripts/test-email.js loic5488@gmail.com
sudo journalctl -u facturio -n 50 --no-pager
```

Après modification du `.env` :

```bash
sudo systemctl restart facturio
```

## 5. Logs côté serveur mail

Si l'app dit « envoyé » mais rien n'arrive :

```bash
sudo tail -100 /var/log/mail.log
sudo grep -i "gmail\|dkim\|dmarc\|reject" /var/log/mail.log
```

Rechercher : `DKIM-Signature`, `Authentication-Results`, `status=bounced`, `550`, `554`.

## 6. Ordre recommandé

1. Assouplir DMARC (`adkim=r`, `aspf=r`).
2. Installer OpenDKIM + record DNS.
3. Attendre propagation (jusqu'à 1 h).
4. Test `test-email.js` vers Gmail.
5. Vérifier boîte spam une fois, puis renforcer DMARC (`p=quarantine`) quand mail-tester est vert.
