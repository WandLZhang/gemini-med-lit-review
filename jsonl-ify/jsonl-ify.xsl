<?xml version="1.0"?>
<xsl:stylesheet version="3.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns="http://www.w3.org/2005/xpath-functions">
<xsl:output method="text" encoding="UTF-8"/>

<xsl:template match="/PubmedArticleSet">

    <xsl:for-each select="PubmedArticle">
        <xsl:variable name="xml">
            <map>
                <string key="_id">
                    <xsl:value-of select="./*/PMID"/>
                </string>
                <string key="doi">
                    <xsl:value-of select="./*/ArticleIdList/ArticleId[@IdType='doi']"/>
                </string>
                <string key="title">
                    <xsl:value-of select=".//ArticleTitle"/>
                </string>
                <string key="abstract">
                    <xsl:value-of select=".//Abstract"/>
                </string>
            </map>
        </xsl:variable>
        <xsl:value-of select="xml-to-json($xml)"/>
        <xsl:text>&#xa;</xsl:text>
    </xsl:for-each>
</xsl:template>

</xsl:stylesheet>
