import os

# Enable PyMySQL as MySQLdb fallback for portability and cloud deployment (e.g. Render / TiDB)
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# TiDB Cloud Serverless compatibility
try:
    from django.db.backends.base.base import BaseDatabaseWrapper
    BaseDatabaseWrapper.check_database_version_supported = lambda self: None

    from django.db.backends.mysql.schema import DatabaseSchemaEditor
    from django.db.backends.base.schema import BaseDatabaseSchemaEditor

    # 1. Decouple ADD COLUMN and ADD CONSTRAINT so TiDB distributed DDL can process them sequentially
    DatabaseSchemaEditor.sql_create_column_inline_fk = None

    # 2. Decouple inline UNIQUE from ADD COLUMN statements for TiDB compatibility
    _orig_iter_column_sql = BaseDatabaseSchemaEditor._iter_column_sql
    def _tidb_iter_column_sql(self, column_db_type, params, model, field, field_db_params, include_default):
        for part in _orig_iter_column_sql(self, column_db_type, params, model, field, field_db_params, include_default):
            if getattr(self, '_adding_field', False) and part == "UNIQUE":
                continue
            yield part

    BaseDatabaseSchemaEditor._iter_column_sql = _tidb_iter_column_sql

    _orig_add_field = DatabaseSchemaEditor.add_field
    def _tidb_add_field(self, model, field):
        self._adding_field = True
        try:
            _orig_add_field(self, model, field)
            if field.unique and not field.primary_key:
                unique_stmt = self._create_unique_sql(model, [field])
                if unique_stmt:
                    self.deferred_sql.append(unique_stmt)
        finally:
            self._adding_field = False

    DatabaseSchemaEditor.add_field = _tidb_add_field

except ImportError:
    pass
