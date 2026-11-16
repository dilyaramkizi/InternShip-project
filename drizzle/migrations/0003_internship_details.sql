BEGIN;

-- Unknown format or slot count is stored as NULL and shown as "to be confirmed", instead of a guessed value.
ALTER TABLE public.internships
  ALTER COLUMN format DROP NOT NULL,
  ALTER COLUMN format DROP DEFAULT,
  ALTER COLUMN slots DROP NOT NULL,
  ALTER COLUMN slots DROP DEFAULT,
  ADD COLUMN benefits text NOT NULL DEFAULT '' CHECK (length(benefits) <= 4000),
  ADD COLUMN contact_email text NOT NULL DEFAULT '' CHECK (length(contact_email) <= 254);

ALTER TABLE public.companies
  ADD COLUMN logo_url text NOT NULL DEFAULT '' CHECK (logo_url = '' OR (logo_url ~ '^https://' AND length(logo_url) <= 500));

-- Magnum: the original Russian posting. Format, slots, pay, duration, requirements, the contact email and
-- whether they sign university paperwork were not in the posting, so they stay unset until Magnum confirms them.
UPDATE public.companies SET
  description = 'Команда корпоративного хранилища данных (КХД) развивает Lakehouse-подход: S3-хранилище (MinIO), Apache Spark и высокопроизводительные OLAP-движки (StarRocks/Trino).',
  city = 'Алматы'
WHERE id = '8f6b0c1e-6a43-4d0a-9a51-1f1c3a7a9b01';

UPDATE public.internships SET
  title = 'Стажёр в отдел КХД',
  department = 'Корпоративное хранилище данных · Data Engineering',
  description = 'Команда корпоративного хранилища данных развивает Lakehouse-подход и ищет стажёров, которым интересно работать на стыке DWH, Data Lake и аналитики. Здесь не просто поддерживают существующие решения, а строят новую платформу данных компании.',
  tasks = E'Участвовать в развитии архитектуры данных на стыке DWH, Data Lake и Analytics\nПомогать внедрять S3-хранилище на базе MinIO\nРаботать с Apache Spark и OLAP-движками StarRocks и Trino\nУчаствовать в реальных проектах команды КХД',
  requirements = '',
  benefits = E'Практический опыт с современным стеком данных\nУчастие в реальных проектах, а не учебные задачи\nВозможность влиять на то, как устроена работа с данными в компании',
  stack = 'DWH, Data Lake, S3, MinIO, Apache Spark, StarRocks, Trino',
  format = NULL,
  slots = NULL,
  pay = '',
  duration = '',
  location = 'Алматы, мкр. Астана 1/10',
  contact = E'Требухова Наталья Григорьевна\nСтарший специалист по подбору персонала\nОтдел найма и адаптации, Департамент организационного развития',
  contact_email = '',
  paperwork = false
WHERE company_id = '8f6b0c1e-6a43-4d0a-9a51-1f1c3a7a9b01';

COMMIT;
