if (!("pacman" %in% rownames(installed.packages()))) {install.packages("pacman")}
pacman::p_load(shiny,
               DT, dplyr, stringr, gsheet, glue, data.table,hablar)
gsheet2text("https://drive.google.com/file/d/1SqcelFLCmrDJLUdYXyWL5wqbZchBRXxY/view?usp=sharing", format='csv') %>% 
  data.table::fread(text=., stringsAsFactors=FALSE, encoding = "UTF-8") %>% 
  as_tibble() %>% 
  mutate(Bildlänk = glue("<a href=\"https://sok.riksarkivet.se/bildvisning/{Bildlänk}\">Länk</a>") %>% as.character()) %>% 
  mutate(across(c(Område, Anmärkningar), ~.x %>% #iconv(to="UTF-8") %>% 
                  str_wrap(width=50) %>% str_replace_all("\n","<br/>"))) %>% 
  convert(fct(`Räkenskap(er)`,
              `Årliga räntan`,
              `Tiondelängd(er)`,
              `Avkortningslängd(er)`,
              `Ovissa persedlar`,
              `Saköreslängd(er)`,
              `Dombok`,
              `Mantalsregister`,
              `Förtäringsregister`,
              `Löningsregister`,
              `Inventarium`,
              `Kungliga brev`,
              `Kvittenser`,
              `Sockenregister`))  -> 
  landskapshandlingar
shinyServer(function(input, output, session) {
    observe({
        output$table <- renderDataTable({DT::datatable(
            landskapshandlingar, 
            rownames = FALSE, 
            filter = 'top', extensions = c('Scroller'), 
            options = list(scrollY = 850,
                           scrollX = TRUE,
                           deferRender = TRUE,
                           scroller = TRUE,
                           buttons = list('excel', "csv"),
                           dom = 'lBfrtip'#,
                          #autoWidth = TRUE,
                           #fixedColumns = FALSE, 
                           #columnDefs = list(list(width = '5%', targets = c(7,8)))
                          ), escape = FALSE)}, server = TRUE
        )})
    
})

